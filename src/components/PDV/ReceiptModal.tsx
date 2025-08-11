import React, { useState } from 'react';
import { X, Printer, Download, Share2, CheckCircle, RefreshCw, Copy, QrCode, Banknote, CreditCard, Smartphone, Gift, ArrowRight } from 'lucide-react';
import { Sale } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { useTheme } from '../../hooks/useTheme';
import { useColors } from '../../hooks/useColors';

interface ReceiptModalProps {
  sale: Sale;
  onClose: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const { theme } = useTheme();
  const { primaryColor, secondaryColor } = useColors();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      // Carregar dados da empresa
      const companyDataStr = localStorage.getItem('company_data');
      const companyData = companyDataStr ? JSON.parse(companyDataStr) : null;
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 297] // Tamanho de papel térmico padrão
      });
      
      const pageWidth = doc.internal.pageSize.width;
      let yPosition = 10;
      
      // Cabeçalho com dados da empresa (apenas se informados)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('CUPOM NÃO FISCAL', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;

      if (companyData) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        // Nome fantasia ou razão social
        if (companyData.nomeFantasia) {
          doc.text(companyData.nomeFantasia.toUpperCase(), pageWidth / 2, yPosition, { align: 'center' });
          yPosition += 4;
        } else if (companyData.razaoSocial) {
          doc.text(companyData.razaoSocial.toUpperCase(), pageWidth / 2, yPosition, { align: 'center' });
          yPosition += 4;
        }

        // CNPJ (se informado)
        if (companyData.cnpj) {
          doc.setFontSize(8);
          doc.text(`CNPJ: ${companyData.cnpj}`, pageWidth / 2, yPosition, { align: 'center' });
          yPosition += 4;
        }

        // Endereço (se informado)
        if (companyData.endereco && companyData.numero) {
          let endereco = `${companyData.endereco}, ${companyData.numero}`;
          if (companyData.complemento) endereco += `, ${companyData.complemento}`;
          
          // Quebrar endereço em múltiplas linhas se necessário
          const enderecoLines = doc.splitTextToSize(endereco, pageWidth - 10);
          enderecoLines.forEach((line: string) => {
            doc.text(line, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 3;
          });
          
          if (companyData.bairro) {
            doc.text(companyData.bairro, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 3;
          }
          
          if (companyData.cidade && companyData.estado) {
            doc.text(`${companyData.cidade}/${companyData.estado}`, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 3;
          }
          
          if (companyData.cep) {
            doc.text(`CEP: ${companyData.cep}`, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 3;
          }
        }

        // Telefone (se informado)
        if (companyData.telefone) {
          doc.text(`Tel: ${companyData.telefone}`, pageWidth / 2, yPosition, { align: 'center' });
          yPosition += 3;
        }
      }
      
      // Linha separadora
      doc.setDrawColor(0);
      doc.setLineWidth(0.1);
      doc.line(5, yPosition, pageWidth - 5, yPosition);
      yPosition += 5;
      
      // Dados da venda
      doc.setFontSize(8);
      doc.text(`CUPOM: ${sale.numero.toString().padStart(6, '0')}`, 5, yPosition);
      yPosition += 4;
      doc.text(`DATA: ${format(new Date(sale.dataVenda), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 5, yPosition);
      yPosition += 4;
      doc.text(`VENDEDOR: ${sale.vendedor}`, 5, yPosition);
      yPosition += 4;
      
      if (sale.clienteNome) {
        doc.text(`CLIENTE: ${sale.clienteNome}`, 5, yPosition);
        yPosition += 4;
      }
      
      // Linha separadora
      doc.setDrawColor(0);
      doc.setLineWidth(0.1);
      doc.line(5, yPosition, pageWidth - 5, yPosition);
      yPosition += 5;
      
      // Cabeçalho dos itens
      doc.setFont('helvetica', 'bold');
      doc.text('ITEM', 5, yPosition);
      doc.text('QTD', 40, yPosition);
      doc.text('VL UN', 50, yPosition);
      doc.text('TOTAL', 65, yPosition);
      yPosition += 4;
      
      // Linha separadora
      doc.setDrawColor(0);
      doc.setLineWidth(0.1);
      doc.line(5, yPosition, pageWidth - 5, yPosition);
      yPosition += 5;
      
      // Itens
      doc.setFont('helvetica', 'normal');
      sale.itens.forEach((item, index) => {
        // Número do item
        doc.text(`${index + 1}`, 5, yPosition);
        
        // Nome do produto (com quebra de linha se necessário)
        const nameLines = doc.splitTextToSize(item.produto.nome, 30);
        nameLines.forEach((line: string, i: number) => {
          doc.text(line, 10, yPosition + (i * 3));
        });
        
        // Avançar posição Y baseado no número de linhas do nome
        const nameHeight = nameLines.length * 3;
        
        // Quantidade, valor unitário e total
        doc.text(`${item.quantidade}`, 40, yPosition);
        doc.text(`${item.precoUnitario.toFixed(2)}`, 50, yPosition);
        doc.text(`${item.total.toFixed(2)}`, 65, yPosition);
        
        yPosition += Math.max(nameHeight, 4) + 2;
      });
      
      // Linha separadora
      doc.setDrawColor(0);
      doc.setLineWidth(0.1);
      doc.line(5, yPosition, pageWidth - 5, yPosition);
      yPosition += 5;
      
      // Totais
      doc.setFont('helvetica', 'normal');
      doc.text('SUBTOTAL:', 5, yPosition);
      doc.text(`${sale.subtotal.toFixed(2)}`, 65, yPosition, { align: 'right' });
      yPosition += 4;
      
      if (sale.desconto > 0) {
        doc.text('DESCONTO:', 5, yPosition);
        doc.text(`-${sale.desconto.toFixed(2)}`, 65, yPosition, { align: 'right' });
        yPosition += 4;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL:', 5, yPosition);
      doc.text(`${sale.total.toFixed(2)}`, 65, yPosition, { align: 'right' });
      yPosition += 6;
      
      // Pagamentos
      doc.setFont('helvetica', 'normal');
      doc.text('FORMA DE PAGAMENTO:', 5, yPosition);
      yPosition += 4;
      
      sale.pagamentos.forEach((pagamento) => {
        const tipoLabel = {
          dinheiro: 'Dinheiro',
          cartao_debito: 'Cartão Débito',
          cartao_credito: 'Cartão Crédito',
          pix: 'PIX',
          vale: 'Vale'
        }[pagamento.tipo];
        
        doc.text(`${tipoLabel}:`, 5, yPosition);
        doc.text(`${pagamento.valor.toFixed(2)}`, 65, yPosition, { align: 'right' });
        yPosition += 4;
        
        if (pagamento.tipo === 'cartao_credito' && pagamento.parcelas && pagamento.parcelas > 1) {
          doc.text(`(${pagamento.parcelas}x de ${(pagamento.valor / pagamento.parcelas).toFixed(2)})`, 5, yPosition);
          yPosition += 4;
        }
      });
      
      if (sale.troco > 0) {
        doc.text('TROCO:', 5, yPosition);
        doc.text(`${sale.troco.toFixed(2)}`, 65, yPosition, { align: 'right' });
        yPosition += 4;
      }
      
      // Linha separadora
      doc.setDrawColor(0);
      doc.setLineWidth(0.1);
      doc.line(5, yPosition, pageWidth - 5, yPosition);
      yPosition += 8;
      
      // Mensagem de agradecimento
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Obrigado pela preferência!', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 4;
      doc.text('Volte sempre!', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;
      
      // QR Code placeholder (em um sistema real, geraria um QR code real)
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(pageWidth / 2 - 10, yPosition, 20, 20, 1, 1, 'F');
      doc.setFontSize(6);
      doc.text('QR CODE', pageWidth / 2, yPosition + 10, { align: 'center' });
      yPosition += 25;
      
      // Rodapé
      doc.setFontSize(7);
      doc.text('DOCUMENTO SEM VALOR FISCAL', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 3;
      doc.text(`ID: ${sale.id.substring(0, 8)}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 3;
      doc.text('Powered by CYBERPIU', pageWidth / 2, yPosition, { align: 'center' });
      
      // Salvar o PDF
      doc.save(`cupom-${sale.numero}.pdf`);
      
      setSuccessMessage('PDF gerado com sucesso!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
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
      setSuccessMessage('Enviado para impressão!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  const copyReceiptNumber = () => {
    navigator.clipboard.writeText(sale.numero.toString().padStart(6, '0'));
    setSuccessMessage('Número do cupom copiado!');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Carregar dados da empresa para exibição
  const companyDataStr = localStorage.getItem('company_data');
  const companyData = companyDataStr ? JSON.parse(companyDataStr) : null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
      }`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: secondaryColor }}>
              <Printer size={24} className="text-white" />
            </div>
            Cupom de Venda
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all hover:scale-110 ${
              theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coluna Esquerda - Cupom */}
          <div>
            <div className={`p-6 rounded-xl mb-6 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                    <CheckCircle size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Venda Finalizada</p>
                    <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                      {formatCurrency(sale.total)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Cupom</p>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{sale.numero.toString().padStart(6, '0')}</p>
                    <button
                      onClick={copyReceiptNumber}
                      className="text-gray-500 hover:text-gray-700"
                      title="Copiar número"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="print:text-black bg-white p-6 rounded-xl border border-gray-200 shadow-lg" id="receipt">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold">CUPOM NÃO FISCAL</h3>
                
                {/* Dados da empresa (apenas se informados) */}
                {companyData && (
                  <div className="mt-4 text-sm">
                    {(companyData.nomeFantasia || companyData.razaoSocial) && (
                      <p className="font-bold">
                        {companyData.nomeFantasia || companyData.razaoSocial}
                      </p>
                    )}
                    
                    {companyData.cnpj && (
                      <p>CNPJ: {companyData.cnpj}</p>
                    )}
                    
                    {companyData.endereco && companyData.numero && (
                      <p>
                        {companyData.endereco}, {companyData.numero}
                        {companyData.complemento && `, ${companyData.complemento}`}
                        {companyData.bairro && ` - ${companyData.bairro}`}
                      </p>
                    )}
                    
                    {companyData.cidade && companyData.estado && (
                      <p>
                        {companyData.cidade}/{companyData.estado}
                        {companyData.cep && ` - CEP: ${companyData.cep}`}
                      </p>
                    )}
                    
                    {companyData.telefone && (
                      <p>Tel: {companyData.telefone}</p>
                    )}
                  </div>
                )}
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
                {sale.clienteNome && <p><strong>Cliente:</strong> {sale.clienteNome}</p>}
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
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(sale.subtotal)}</span>
                </div>
                
                {sale.desconto > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Desconto:</span>
                    <span>- {formatCurrency(sale.desconto)}</span>
                  </div>
                )}
                
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
                <p>Volte sempre!</p>
                <div className="mt-4 flex justify-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                    <QrCode size={40} className="text-gray-400" />
                  </div>
                </div>
                <p className="mt-4">DOCUMENTO SEM VALOR FISCAL</p>
                <p className="mt-2">ID: {sale.id.substring(0, 8)}</p>
                <p className="mt-2">Powered by CYBERPIU</p>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Ações e Informações */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Printer size={20} />
              Opções de Impressão
            </h3>

            <div className="grid grid-cols-1 gap-4 mb-6">
              <button
                onClick={printReceipt}
                disabled={isPrinting}
                className={`py-4 px-6 rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-3 text-white ${
                  isPrinting ? 'bg-gray-400 cursor-not-allowed' : ''
                }`}
                style={{ backgroundColor: isPrinting ? undefined : primaryColor }}
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
                  isGeneratingPDF ? 'bg-gray-400 cursor-not-allowed' : ''
                }`}
                style={{ backgroundColor: isGeneratingPDF ? undefined : secondaryColor }}
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
              
              <button
                onClick={() => {
                  setSuccessMessage('Função de compartilhamento em desenvolvimento');
                  setShowSuccess(true);
                  setTimeout(() => setShowSuccess(false), 3000);
                }}
                className={`py-4 px-6 rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-3 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Share2 size={20} />
                Compartilhar Cupom
              </button>
            </div>

            {/* Resumo da Venda */}
            <div className={`p-6 rounded-xl mb-6 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <h4 className="font-bold mb-4">Resumo da Venda</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Número da Venda:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{sale.numero.toString().padStart(6, '0')}</span>
                    <button
                      onClick={copyReceiptNumber}
                      className="text-gray-500 hover:text-gray-700"
                      title="Copiar número"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Data/Hora:</span>
                  <span className="font-medium">
                    {format(new Date(sale.dataVenda), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Vendedor:</span>
                  <span className="font-medium">{sale.vendedor}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Itens:</span>
                  <span className="font-medium">{sale.itens.length}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(sale.subtotal)}</span>
                </div>
                
                {sale.desconto > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Desconto:</span>
                    <span className="font-medium text-red-600">- {formatCurrency(sale.desconto)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold" style={{ color: secondaryColor }}>{formatCurrency(sale.total)}</span>
                </div>
              </div>
            </div>

            {/* Formas de Pagamento */}
            <div className={`p-6 rounded-xl mb-6 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <h4 className="font-bold mb-4">Formas de Pagamento</h4>
              
              <div className="space-y-3">
                {sale.pagamentos.map((pagamento, index) => {
                  const tipoLabel = {
                    dinheiro: 'Dinheiro',
                    cartao_debito: 'Cartão Débito',
                    cartao_credito: 'Cartão Crédito',
                    pix: 'PIX',
                    vale: 'Vale'
                  }[pagamento.tipo];
                  
                  const icon = {
                    dinheiro: <Banknote size={16} className="text-green-600" />,
                    cartao_debito: <CreditCard size={16} className="text-blue-600" />,
                    cartao_credito: <CreditCard size={16} className="text-purple-600" />,
                    pix: <Smartphone size={16} className="text-cyan-600" />,
                    vale: <Gift size={16} className="text-yellow-600" />
                  }[pagamento.tipo];
                  
                  return (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {icon}
                        <span>{tipoLabel}</span>
                        {pagamento.parcelas && pagamento.parcelas > 1 && (
                          <span className="text-xs text-gray-500">
                            ({pagamento.parcelas}x)
                          </span>
                        )}
                      </div>
                      <span className="font-bold">{formatCurrency(pagamento.valor)}</span>
                    </div>
                  );
                })}
                
                {sale.troco > 0 && (
                  <div className="flex justify-between items-center pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <ArrowRight size={16} className="text-green-600" />
                      <span className="font-medium text-green-600">Troco</span>
                    </div>
                    <span className="font-bold text-green-600">{formatCurrency(sale.troco)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mensagem de Sucesso */}
            {showSuccess && (
              <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in-out">
                <CheckCircle size={20} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Botão de Fechar */}
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