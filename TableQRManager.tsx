import { Table } from "../types";
import { QRCodeSVG } from "qrcode.react";
import { Download, Printer, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

interface TableQRManagerProps {
  tables: Table[];
}

export default function TableQRManager({ tables }: TableQRManagerProps) {
  const downloadQR = (tableId: number, tableNumber: string) => {
    const svg = document.getElementById(`qr-${tableId}`);
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-${tableNumber}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
      toast.success(`${tableNumber} QR kodi yuklab olindi!`);
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const printQR = (tableId: number, tableNumber: string) => {
    const svg = document.getElementById(`qr-${tableId}`);
    if (!svg) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR - ${tableNumber}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
            .container { text-align: center; border: 2px solid #000; padding: 40px; border-radius: 20px; }
            h1 { font-size: 48px; margin-bottom: 20px; }
            p { font-size: 24px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${tableNumber}</h1>
            ${svg.outerHTML}
            <p>Scan to Order</p>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {tables.map((table) => {
        const menuUrl = `${window.location.origin}/menu/${table.id}`;
        
        return (
          <div key={table.id} className="bg-white p-8 rounded-[40px] border border-[#141414]/5 shadow-sm hover:shadow-xl transition-all duration-500 group">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-serif italic">{table.number}</h3>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#141414]/40 mt-1">Stol QR kodi</p>
              </div>
              <a 
                href={menuUrl} 
                target="_blank" 
                rel="noreferrer"
                className="p-2 text-[#141414]/40 hover:text-[#141414] transition-colors"
              >
                <ExternalLink size={20} />
              </a>
            </div>

            <div className="flex justify-center mb-8 p-6 bg-[#F5F5F0] rounded-3xl group-hover:bg-white transition-colors duration-500 border border-transparent group-hover:border-[#141414]/5">
              <QRCodeSVG
                id={`qr-${table.id}`}
                value={menuUrl}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => downloadQR(table.id, table.number)}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#141414] text-white font-bold text-sm hover:opacity-90 transition-opacity"
              >
                <Download size={16} />
                Yuklash
              </button>
              <button
                onClick={() => printQR(table.id, table.number)}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-[#141414]/10 font-bold text-sm hover:bg-[#F5F5F0] transition-colors"
              >
                <Printer size={16} />
                Chop etish
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
