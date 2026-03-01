import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("restaurant.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id INTEGER,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    is_paid INTEGER DEFAULT 0,
    total_price REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(table_id) REFERENCES tables(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    menu_item_id INTEGER,
    quantity INTEGER,
    price REAL,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(menu_item_id) REFERENCES menu_items(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

try {
  db.exec("ALTER TABLE orders ADD COLUMN is_paid INTEGER DEFAULT 0");
} catch (e) {}

// Seed initial data if empty and never seeded before
const isSeeded = db.prepare("SELECT value FROM settings WHERE key = 'seeded'").get() as { value: string } | undefined;

if (!isSeeded) {
  const menuCount = db.prepare("SELECT COUNT(*) as count FROM menu_items").get() as { count: number };
  if (menuCount.count === 0) {
    const insertMenu = db.prepare("INSERT INTO menu_items (name, description, price, category) VALUES (?, ?, ?, ?)");
    insertMenu.run("Hot-dog Classic", "Classic hot-dog with mustard and ketchup", 15000, "Hot-dog");
    insertMenu.run("Lavash Beef", "Juicy beef lavash with fresh veggies", 25000, "Lavash");
  }
  
  const tableCount = db.prepare("SELECT COUNT(*) as count FROM tables").get() as { count: number };
  if (tableCount.count === 0) {
    const insertTable = db.prepare("INSERT INTO tables (number) VALUES (?)");
    for (let i = 1; i <= 10; i++) {
      insertTable.run(`Table ${i}`);
    }
  }
  
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('seeded', 'true');
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());

  // WebSocket logic
  const clients = new Set<WebSocket>();
  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
  });

  const broadcast = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // API Routes
  app.get("/api/menu", (req, res) => {
    const items = db.prepare("SELECT * FROM menu_items").all();
    res.json(items);
  });

  app.post("/api/menu", (req, res) => {
    const { name, description, price, category, image_url } = req.body;
    const info = db.prepare("INSERT INTO menu_items (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)")
      .run(name, description, price, category, image_url);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/menu/:id", (req, res) => {
    const { name, description, price, category, image_url } = req.body;
    db.prepare("UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?, image_url = ? WHERE id = ?")
      .run(name, description, price, category, image_url, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/menu/:id", (req, res) => {
    const id = parseInt(req.params.id);
    console.log(`Aggressive delete attempt for menu item: ${id}`);
    try {
      // Use a transaction to ensure all related data is cleaned up
      const transaction = db.transaction(() => {
        // 1. Remove from order_items (history)
        db.prepare("DELETE FROM order_items WHERE menu_item_id = ?").run(id);
        
        // 2. Remove from menu_items
        const info = db.prepare("DELETE FROM menu_items WHERE id = ?").run(id);
        
        return info.changes;
      });

      const changes = transaction();
      console.log(`Delete operation finished. Changes: ${changes}`);
      
      if (changes === 0) {
        return res.status(404).json({ error: "Taom topilmadi yoki allaqachon o'chirilgan" });
      }
      
      res.json({ success: true, message: "Taom butunlay o'chirildi" });
    } catch (err) {
      console.error("CRITICAL DELETE ERROR:", err);
      res.status(500).json({ error: "O'chirishda texnik xatolik: " + (err as Error).message });
    }
  });

  app.get("/api/tables", (req, res) => {
    const tables = db.prepare("SELECT * FROM tables").all();
    res.json(tables);
  });

  app.get("/api/orders", (req, res) => {
    const orders = db.prepare(`
      SELECT o.*, t.number as table_number 
      FROM orders o 
      JOIN tables t ON o.table_id = t.id 
      ORDER BY o.created_at DESC
    `).all();
    
    const ordersWithItems = orders.map((order: any) => {
      const items = db.prepare(`
        SELECT oi.*, mi.name 
        FROM order_items oi 
        JOIN menu_items mi ON oi.menu_item_id = mi.id 
        WHERE oi.order_id = ?
      `).all(order.id);
      return { ...order, items };
    });
    
    res.json(ordersWithItems);
  });

  app.post("/api/orders", (req, res) => {
    const { table_id, items, payment_method, total_price, is_paid } = req.body;
    
    const transaction = db.transaction(() => {
      const orderInfo = db.prepare("INSERT INTO orders (table_id, payment_method, total_price, is_paid) VALUES (?, ?, ?, ?)")
        .run(table_id, payment_method, total_price, is_paid ? 1 : 0);
      
      const orderId = orderInfo.lastInsertRowid;
      const insertItem = db.prepare("INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)");
      
      for (const item of items) {
        insertItem.run(orderId, item.id, item.quantity, item.price);
      }
      
      return orderId;
    });

    try {
      const orderId = transaction();
      const newOrder = db.prepare(`
        SELECT o.*, t.number as table_number 
        FROM orders o 
        JOIN tables t ON o.table_id = t.id 
        WHERE o.id = ?
      `).get(orderId) as any;
      
      const orderItems = db.prepare(`
        SELECT oi.*, mi.name 
        FROM order_items oi 
        JOIN menu_items mi ON oi.menu_item_id = mi.id 
        WHERE oi.order_id = ?
      `).all(orderId);

      const orderData = { ...newOrder, items: orderItems };
      broadcast({ type: "NEW_ORDER", order: orderData });
      res.json(orderData);
    } catch (err) {
      res.status(500).json({ error: "Failed to place order" });
    }
  });

  app.patch("/api/orders/:id", (req, res) => {
    const { status, is_paid } = req.body;
    if (status !== undefined) {
      db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, req.params.id);
    }
    if (is_paid !== undefined) {
      db.prepare("UPDATE orders SET is_paid = ? WHERE id = ?").run(is_paid ? 1 : 0, req.params.id);
    }
    
    const updatedOrder = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id) as any;
    broadcast({ type: "ORDER_UPDATED", orderId: req.params.id, status: updatedOrder.status, is_paid: updatedOrder.is_paid, table_id: updatedOrder.table_id });
    res.json({ success: true });
  });

  app.get("/api/orders/status", (req, res) => {
    const ids = req.query.ids as string;
    if (!ids) return res.json([]);
    const idArray = ids.split(',');
    const placeholders = idArray.map(() => '?').join(',');
    const orders = db.prepare(`
      SELECT o.*, t.number as table_number 
      FROM orders o 
      JOIN tables t ON o.table_id = t.id 
      WHERE o.id IN (${placeholders})
      ORDER BY o.created_at DESC
    `).all(...idArray);
    
    const ordersWithItems = orders.map((order: any) => {
      const items = db.prepare(`
        SELECT oi.*, mi.name 
        FROM order_items oi 
        JOIN menu_items mi ON oi.menu_item_id = mi.id 
        WHERE oi.order_id = ?
      `).all(order.id);
      return { ...order, items };
    });
    
    res.json(ordersWithItems);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
