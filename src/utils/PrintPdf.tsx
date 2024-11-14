
import { jsPDF } from "jspdf";





export default function  PrintPdf (text: string, destino: string )  {

 
    
const doc = new jsPDF();
  doc.text(text, 10, 10);
  doc.save(`${destino}.pdf`);
   
  
};



