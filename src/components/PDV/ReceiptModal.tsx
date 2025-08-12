import React, { useState } from 'react';
import { X, Printer, Download, CheckCircle, RefreshCw } from 'lucide-react';
import { Sale } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { useTheme } from '../../hooks/useTheme';

interface ReceiptModalProps {
  sale: Sale;
  onClose: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const { theme } = useTheme();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 297]
      });
      
      const pageWidth = doc.internal.pageSize.width;
      let yPosition = 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('CUPOM NÃO FISCAL', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      doc.setFontSize(8);
      doc.text(`CUPOM: ${sale.numero.toString().padStart(6, '0')}`, 5, yPosition);
      yPosition += 4;
      doc.text(`DATA: ${format(new Date(sale.dataVenda), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 5, yPosition);
      yPosition += 4;
      doc.text(`VENDEDOR: ${sale.vendedor}`, 5, yPosition);
      yPosition += 8;
      
      // Itens
      sale.itens.forEach((item, index) => {
        doc.text(`${index + 1}. ${item.produto.nome}`, 5, yPosition);
        yPosition += 4;
        doc.text(`${item.quantidade} x ${item.precoUnitario.toFixed(2)} = ${item.total.toFixed(2)}`, 10, yPosition);
        yPosition += 6;
      });
      
      yPosition += 5;
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL: R$ ${sale.total.toFixed(2)}`, 5, yPosition);
      yPosition += 8;
      
      // Pagamentos
      sale.pagamentos.forEach((pagamento) => {
        const tipoLabel = {
          dinheiro: 'Dinheiro',
          cartao_debito: 'Cartão Débito',
          cartao_credito: 'Cartão Crédito',
          pix: 'PIX',
          vale: 'Vale'
        }[pagamento.tipo];
        
        doc.text(`${tipoLabel}: R$ ${pagamento.valor.toFixed(2)}`, 5, yPosition);
        yPosition += 4;
      });
      
      if (sale.troco > 0) {
        doc.text(`TROCO: R$ ${sale.troco.toFixed(2)}`, 5, yPosition);
        yPosition += 8;
      }
      
      doc.setFont('helvetica', 'normal');
      doc.text('Obrigado pela preferência!', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 4;
      doc.text('Powered by CYBERPIU', pageWidth / 2, yPosition, { align: 'center' });
      
      doc.save(`cupom-${sale.numero}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const printReceipt = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 1000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
      }`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-secondary">
              <Printer size={24} className="text-white" />
            </div>
            Cupom de Venda
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all hover:scale-110 ${
              theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cupom */}
          <div className="print:text-black bg-white p-6 rounded-xl border border-gray-200 shadow-lg" id="receipt">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold">CUPOM NÃO FISCAL</h3>
            </div>

            <div className="mb-4 text-sm">
              <div className="flex justify-between">
                <p><strong>Cupom:</strong> {sale.numero.toString().padStart(6, '0')}</p>
                <p><strong>Data:</strong> {format(new Date(sale.dataVenda), 'dd/MM/yyyy', { locale: ptBR })}</p>
              </div>
              <div className="flex justify-between">
                <p><strong>Hora:</strong> {format(new Date(sale.dataVenda), 'HH:mm:ss', { locale: ptBR })}</p>
                <p><strong>Vendedor:</strong> {sale.vendedor}</p>
              </div>
            </div>

            <div className="border-t border-b border-gray-300 py-4 mb-4">
              <div className="flex justify-between text-xs font-bold mb-2 pb-2 border-b border-gray-200">
                <span className="w-1/2">DESCRIÇÃO</span>
                <span className="w-1/6 text-center">QTD</span>
                <span className="w-1/6 text-right">VL UN</span>
                <span className="w-1/6 text-right">TOTAL</span>
              </div>
              
              {sale.itens.map((item, index) => (
                <div key={index} className="mb-3 text-sm">
                  <div className="flex justify-between">
                    <span className="w-1/2 font-medium truncate">{item.produto.nome}</span>
                    <span className="w-1/6 text-center">{item.quantidade}</span>
                    <span className="w-1/6 text-right">{formatCurrency(item.precoUnitario)}</span>
                    <span className="w-1/6 text-right font-bold">{formatCurrency(item.total)}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Cód: {item.produto.codigo}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-gray-200">
                <span>TOTAL:</span>
                <span>{formatCurrency(sale.total)}</span>
              </div>
            </div>

            <div className="mb-4 text-sm">
              <p className="font-medium mb-2">Formas de Pagamento:</p>
              {sale.pagamentos.map((pagamento, index) => {
                const tipoLabel = {
                  dinheiro: 'Dinheiro',
                  cartao_debito: 'Cartão Débito',
                  cartao_credito: 'Cartão Crédito',
                  pix: 'PIX',
                  vale: 'Vale'
                }[pagamento.tipo];
                
                return (
                  <div key={index} className="flex justify-between">
                    <span>{tipoLabel}:</span>
                    <span>{formatCurrency(pagamento.valor)}</span>
                  </div>
                );
              })}
              
              {sale.troco > 0 && (
                <div className="flex justify-between font-medium text-green-600 mt-2 pt-2 border-t border-gray-200">
                  <span>Troco:</span>
                  <span>{formatCurrency(sale.troco)}</span>
                </div>
              )}
            </div>

            <div className="text-center text-xs text-gray-500 mt-6">
              <p>Obrigado pela preferência!</p>
              <p className="mt-4">DOCUMENTO SEM VALOR FISCAL</p>
              <p className="mt-2">Powered by CYBERPIU</p>
            </div>
          </div>

          {/* Ações */}
          <div>
            <div className="grid grid-cols-1 gap-4 mb-6">
              <button
                onClick={printReceipt}
                disabled={isPrinting}
                className={`py-4 px-6 rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-3 text-white ${
                  isPrinting ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary'
                }`}
              >
                {isPrinting ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Enviando para impressora...
                  </>
                ) : (
                  <>
                    <Printer size={20} />
                    Imprimir Cupom
                  </>
                )}
              </button>
              
              <button
                onClick={generatePDF}
                disabled={isGeneratingPDF}
                className={`py-4 px-6 rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-3 text-white ${
                  isGeneratingPDF ? 'bg-gray-400 cursor-not-allowed' : 'bg-secondary'
                }`}
              >
                {isGeneratingPDF ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    Baixar PDF
                  </>
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              className={`w-full py-4 px-6 rounded-xl font-bold transition-all hover:scale-105 ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;