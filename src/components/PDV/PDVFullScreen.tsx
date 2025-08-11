import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, X, Plus, Minus, Calculator, Trash2, Package, Barcode, DollarSign, Clock, User, Zap, TrendingUp, ArrowLeft, AlertCircle } from 'lucide-react';
import { Product, SaleItem, PaymentMethod, Sale, CashSession } from '../../types';
import { db } from '../../services/database';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useColors } from '../../hooks/useColors';
import PaymentModal from './PaymentModal';
import ReceiptModal from './ReceiptModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PDVFullScreenProps {
  onBack: () => void;
}

const PDVFullScreen: React.FC<PDVFullScreenProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { primaryColor, secondaryColor } = useColors();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [currentCashSession, setCurrentCashSession] = useState<CashSession | null>(null);
  const [activeCashes, setActiveCashes] = useState<CashSession[]>([]);
  const [selectedCashIndex, setSelectedCashIndex] = useState(0);
  const [showCashClosedModal, setShowCashClosedModal] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
    loadCashSessions();
    loadCompanyData();
    
    // Atualizar hora atual
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        if (cart.length > 0) {
          removeFromCart(cart[cart.length - 1].produtoId);
        }
      } else if (e.key === 'F5') {
        e.preventDefault();
        clearCart();
      } else if (e.key === 'F7') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (selectedProduct) {
          addToCart(selectedProduct, quantity);
        }
      } else if (e.key === 'F10') {
        e.preventDefault();
        if (cart.length > 0) {
          setShowPaymentModal(true);
        }
      } else if (e.key === 'F11') {
        e.preventDefault();
        clearCart();
      } else if (e.key === 'Escape') {
        setSearchTerm('');
        setSelectedProduct(null);
        setQuantity(1);
        setUnitPrice(0);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [cart, selectedProduct, quantity]);

  const loadProducts = () => {
    const allProducts = db.getAllProducts().filter(p => p.ativo);
    setProducts(allProducts);
  };

  const loadCashSessions = () => {
    const sessions = db.getAllCashSessions().filter(s => s.status === 'aberto');
    setActiveCashes(sessions);
    
    if (sessions.length > 0) {
      setCurrentCashSession(sessions[0]);
    }
  };

  const loadCompanyData = () => {
    const savedData = localStorage.getItem('company_data');
    if (savedData) {
      setCompanyData(JSON.parse(savedData));
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const product = db.getProductByCode(searchTerm);
      if (product) {
        setSelectedProduct(product);
        setUnitPrice(product.preco);
        setQuantity(1);
        setSearchTerm('');
      }
    }
  };

  const checkCashOpen = (): boolean => {
    if (!currentCashSession) {
      setShowCashClosedModal(true);
      return false;
    }
    return true;
  };

  const addToCart = (product: Product, qty: number = 1) => {
    // Verificar se o caixa está aberto
    if (!checkCashOpen()) {
      return;
    }

    if (product.estoque < qty) {
      alert('Estoque insuficiente!');
      return;
    }

    const existingItem = cart.find(item => item.produtoId === product.id);
    
    if (existingItem) {
      const newQuantity = existingItem.quantidade + qty;
      if (product.estoque < newQuantity) {
        alert('Estoque insuficiente!');
        return;
      }
      
      setCart(cart.map(item =>
        item.produtoId === product.id
          ? { ...item, quantidade: newQuantity, total: newQuantity * item.precoUnitario }
          : item
      ));
    } else {
      const newItem: SaleItem = {
        produtoId: product.id,
        produto: product,
        quantidade: qty,
        precoUnitario: unitPrice || product.preco,
        desconto: 0,
        total: qty * (unitPrice || product.preco)
      };
      setCart([...cart, newItem]);
    }

    setSelectedProduct(null);
    setQuantity(1);
    setUnitPrice(0);
  };

  const removeFromCart = (produtoId: string) => {
    setCart(cart.filter(item => item.produtoId !== produtoId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedProduct(null);
    setQuantity(1);
    setUnitPrice(0);
  };

  const getTotalCart = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const handlePaymentComplete = (payments: PaymentMethod[], troco: number) => {
    if (!user || !currentCashSession) return;

    const sale: Omit<Sale, 'id' | 'numero'> = {
      itens: cart,
      subtotal: getTotalCart(),
      desconto: 0,
      total: getTotalCart(),
      pagamentos: payments,
      troco,
      vendedorId: user.id,
      vendedor: user.nome,
      dataVenda: new Date().toISOString(),
      cancelada: false,
      caixaId: currentCashSession.caixaId
    };

    const newSale = db.createSale(sale);
    setLastSale(newSale);
    setCart([]);
    setSelectedProduct(null);
    setQuantity(1);
    setUnitPrice(0);
    setShowPaymentModal(false);
    setShowReceiptModal(true);
    loadProducts();
  };

  const handleOpenCash = () => {
    setShowCashClosedModal(false);
    // Aqui você pode implementar a lógica para abrir o modal de abertura de caixa
    // ou redirecionar para a tela de controle de caixa
    alert('Redirecionando para abertura de caixa...');
  };

  const shortcuts = [
    { key: 'F3', label: 'Excluir Item', action: () => cart.length > 0 && removeFromCart(cart[cart.length - 1].produtoId), color: '#dc2626', icon: Trash2 },
    { key: 'F5', label: 'Nova Venda', action: clearCart, color: '#16a34a', icon: Plus },
    { key: 'F7', label: 'Pesquisar', action: () => searchInputRef.current?.focus(), color: primaryColor, icon: Search },
    { key: 'F8', label: 'Adicionar', action: () => selectedProduct && addToCart(selectedProduct, quantity), color: '#7c3aed', icon: Package },
    { key: 'F10', label: 'Finalizar', action: () => cart.length > 0 && setShowPaymentModal(true), color: secondaryColor, icon: DollarSign },
    { key: 'F11', label: 'Cancelar', action: clearCart, color: '#6b7280', icon: X }
  ];

  // Determinar o nome a ser exibido
  const getDisplayName = () => {
    if (companyData?.nomeFantasia) {
      return companyData.nomeFantasia;
    }
    return 'PDV - BANCA';
  };

  return (
    <div className={`h-screen flex flex-col ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800' 
        : 'bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100'
    }`}>
      {/* Header Compacto */}
      <div className={`shadow-xl p-4 border-b-2 ${
        theme === 'dark' ? 'bg-slate-800 border-orange-500' : 'bg-white border-blue-500'
      }`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'bg-slate-700 text-white hover:bg-slate-600' 
                  : 'bg-slate-600 text-white hover:bg-slate-700'
              }`}
            >
              <ArrowLeft size={20} />
              Voltar
            </button>
            
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                {companyData?.logo ? (
                  <img src={companyData.logo} alt="Logo" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <ShoppingCart className="text-white" size={24} />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: primaryColor }}>
                  {getDisplayName()}
                </h1>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-slate-600'}`}>
                  {currentCashSession?.caixa || 'Nenhum caixa selecionado'}
                </p>
              </div>
            </div>

            {/* Seletor de Caixas Inline */}
            {activeCashes.length > 1 && (
              <div className="flex items-center gap-2 ml-8">
                <span className="text-sm font-semibold">Caixas:</span>
                {activeCashes.slice(0, 3).map((session, index) => (
                  <button
                    key={session.id}
                    onClick={() => {
                      setSelectedCashIndex(index);
                      setCurrentCashSession(session);
                    }}
                    className={`px-3 py-1 rounded-lg font-medium transition-all text-sm ${
                      selectedCashIndex === index
                        ? 'text-white shadow-lg'
                        : theme === 'dark' 
                          ? 'bg-slate-700 text-blue-300 hover:bg-slate-600' 
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                    style={selectedCashIndex === index ? { backgroundColor: secondaryColor } : {}}
                  >
                    {session.caixa}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
              currentCashSession 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                currentCashSession ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="font-medium text-sm">
                {currentCashSession ? 'CAIXA ABERTO' : 'CAIXA FECHADO'}
              </span>
            </div>
            
            <div className="text-right">
              <div className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-slate-600'}`}>
                {user?.nome} • {format(currentTime, 'HH:mm:ss', { locale: ptBR })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Área Principal - Sem Atalhos */}
      <div className="flex-1 flex p-4 gap-4 overflow-hidden">
        {/* Painel Esquerdo - Busca e Produto */}
        <div className="w-1/3 flex flex-col gap-4 overflow-y-auto">
          {/* Busca */}
          <div className={`rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
            <div 
              className="text-white p-3 rounded-t-xl flex items-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              <Barcode size={20} />
              <h3 className="font-bold">BUSCA PRODUTO</h3>
            </div>
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Código, nome ou código de barras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className={`w-full pl-10 pr-4 py-3 text-lg border-2 rounded-lg focus:ring-2 transition-all ${
                    theme === 'dark' 
                      ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-400 focus:ring-blue-400/30' 
                      : 'bg-white border-blue-300 text-gray-800 focus:border-blue-500 focus:ring-blue-500/30'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Produto Selecionado */}
          {selectedProduct && (
            <div className={`rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
              <div 
                className="text-white p-3 rounded-t-xl flex items-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                <Package size={20} />
                <h3 className="font-bold">PRODUTO SELECIONADO</h3>
              </div>
              <div className="p-4">
                <div className="flex gap-4 mb-4">
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-blue-300 flex items-center justify-center bg-blue-50">
                    {selectedProduct.foto ? (
                      <img
                        src={selectedProduct.foto}
                        alt={selectedProduct.nome}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <Package size={32} className="text-blue-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{selectedProduct.nome}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Código: <span className="font-bold">{selectedProduct.codigo}</span></div>
                      <div>Estoque: <span className="font-bold">{selectedProduct.estoque}</span></div>
                      <div>Preço: <span className="font-bold">R$ {selectedProduct.preco.toFixed(2)}</span></div>
                      <div>Categoria: <span className="font-bold">{selectedProduct.categoria}</span></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">QUANTIDADE</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className={`w-full px-3 py-2 border rounded-lg text-center font-bold ${
                        theme === 'dark' 
                          ? 'bg-slate-700 border-slate-600 text-white' 
                          : 'bg-white border-blue-300 text-gray-800'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">VALOR UNIT.</label>
                    <input
                      type="number"
                      step="0.01"
                      value={unitPrice || selectedProduct.preco}
                      onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg text-center font-bold ${
                        theme === 'dark' 
                          ? 'bg-slate-700 border-slate-600 text-white' 
                          : 'bg-white border-blue-300 text-gray-800'
                      }`}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <div 
                    className="text-2xl font-bold text-center p-3 rounded-lg text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    R$ {(quantity * (unitPrice || selectedProduct.preco)).toFixed(2)}
                  </div>
                </div>

                <button
                  onClick={() => addToCart(selectedProduct, quantity)}
                  className="w-full text-white py-3 px-4 rounded-lg font-bold hover:opacity-90 transition-all"
                  style={{ backgroundColor: secondaryColor }}
                >
                  ⚡ ADICIONAR (F8)
                </button>
              </div>
            </div>
          )}

          {/* Controles de Quantidade */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              className={`py-3 px-3 rounded-lg font-bold transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-700 text-white hover:bg-slate-600' 
                  : 'bg-slate-600 text-white hover:bg-slate-700'
              }`}
            >
              QTD - ({quantity})
            </button>
            <button
              onClick={() => setQuantity(prev => prev + 1)}
              className={`py-3 px-3 rounded-lg font-bold transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-700 text-white hover:bg-slate-600' 
                  : 'bg-slate-600 text-white hover:bg-slate-700'
              }`}
            >
              QTD + ({quantity})
            </button>
          </div>
        </div>

        {/* Painel Central - Carrinho */}
        <div className={`w-1/3 rounded-xl shadow-lg flex flex-col ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
          <div 
            className="text-white p-3 rounded-t-xl flex items-center gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            <ShoppingCart size={20} />
            <h3 className="font-bold">CARRINHO</h3>
            <span className="ml-auto bg-white/20 px-2 py-1 rounded-full text-sm font-bold">
              {cart.length}
            </span>
          </div>
          
          <div className="flex-1 p-3 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <Package size={48} className="mx-auto mb-3 text-blue-300" />
                <p className="font-medium">Carrinho vazio</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item, index) => (
                  <div 
                    key={item.produtoId} 
                    className={`p-3 rounded-lg border-l-4 transition-all hover:shadow-md ${
                      theme === 'dark' 
                        ? 'bg-slate-700 border-orange-500' 
                        : 'bg-blue-50 border-orange-500'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.produto.nome}</h4>
                        <p className="text-xs text-gray-500 font-mono">{item.produto.codigo}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.produtoId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">
                        {item.quantidade} × R$ {item.precoUnitario.toFixed(2)}
                      </span>
                      <span className="font-bold" style={{ color: secondaryColor }}>
                        R$ {item.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Painel Direito - Totais e Ações */}
        <div className="w-1/3 flex flex-col gap-4">
          {/* Total */}
          <div className={`rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
            <div 
              className="text-white p-3 rounded-t-xl flex items-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              <Calculator size={20} />
              <h3 className="font-bold">TOTAL</h3>
            </div>
            <div className="p-6">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2" style={{ color: primaryColor }}>
                  R$ {getTotalCart().toFixed(2)}
                </div>
                <div className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-slate-500'}`}>
                  {cart.length} {cart.length === 1 ? 'item' : 'itens'}
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3">
            {cart.length > 0 && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full text-white py-4 px-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg"
                style={{ backgroundColor: secondaryColor }}
              >
                💳 FINALIZAR VENDA (F10)
              </button>
            )}
            
            <button
              onClick={clearCart}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-green-700 transition-all"
            >
              🗑️ NOVA VENDA (F5)
            </button>
          </div>

          {/* Info Sistema */}
          <div className={`rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
            <div 
              className="text-white p-2 rounded-t-xl flex items-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              <User size={16} />
              <h3 className="font-bold text-sm">SISTEMA</h3>
            </div>
            <div className="p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Operador:</span>
                <span className="font-bold">{user?.nome}</span>
              </div>
              <div className="flex justify-between">
                <span>Caixa:</span>
                <span className="font-bold">{currentCashSession?.caixa || 'Fechado'}</span>
              </div>
              <div className="flex justify-between">
                <span>Itens:</span>
                <span className="font-bold">{cart.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Atalhos Fixos na Parte Inferior */}
      <div className={`p-3 border-t-2 ${
        theme === 'dark' ? 'bg-slate-800 border-orange-500' : 'bg-white border-blue-500'
      }`}>
        <div className="grid grid-cols-6 gap-2 max-w-6xl mx-auto">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <button
                key={shortcut.key}
                className={`p-2 rounded-xl text-center transition-all hover:scale-105 hover:shadow-lg ${
                  theme === 'dark' 
                    ? 'bg-slate-700 hover:bg-slate-600 text-blue-200' 
                    : 'bg-blue-50 hover:bg-blue-100 text-slate-700'
                }`}
                onClick={shortcut.action}
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-1 mx-auto"
                  style={{ backgroundColor: shortcut.color }}
                >
                  <Icon size={16} className="text-white" />
                </div>
                <div className="font-bold text-xs">{shortcut.key}</div>
                <div className="text-xs">{shortcut.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className={`p-2 text-center border-t ${
        theme === 'dark' ? 'bg-slate-900 border-slate-700 text-blue-300' : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
        <p className="text-xs">
          Powered by <span className="font-bold" style={{ color: secondaryColor }}>CYBERPIU</span> • 
          PDV - BANCA v1.0.0
        </p>
      </div>

      {/* Modal de Caixa Fechado */}
      {showCashClosedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} className="text-red-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Caixa Fechado</h2>
              <p className="text-gray-600 mb-8">
                O caixa está fechado. É necessário abrir um caixa para adicionar produtos ao carrinho.
              </p>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCashClosedModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleOpenCash}
                  className="flex-1 px-6 py-3 text-white rounded-lg hover:opacity-90 font-medium"
                  style={{ backgroundColor: secondaryColor }}
                >
                  Abrir Caixa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <PaymentModal
          total={getTotalCart()}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {showReceiptModal && lastSale && (
        <ReceiptModal
          sale={lastSale}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
};

export default PDVFullScreen;