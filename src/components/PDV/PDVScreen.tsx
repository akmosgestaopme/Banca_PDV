import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, X, Calculator, Package, Barcode, DollarSign, Clock, User, ArrowLeft, AlertCircle } from 'lucide-react';
import { Product, SaleItem, PaymentMethod, Sale, CashSession } from '../../types';
import { db } from '../../services/database';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import PaymentModal from './PaymentModal';
import ReceiptModal from './ReceiptModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PDVScreenProps {
  onBack?: () => void;
}

const PDVScreen: React.FC<PDVScreenProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentCashSession, setCurrentCashSession] = useState<CashSession | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      const allProducts = await db.getAllProducts();
      setProducts(allProducts.filter(p => p.ativo));
      
      const sessions = await db.getAllCashSessions();
      const openSessions = sessions.filter(s => s.status === 'aberto');
      if (openSessions.length > 0) {
        setCurrentCashSession(openSessions[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleSearchKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      try {
        const product = await db.getProductByCode(searchTerm);
        if (product) {
          setSelectedProduct(product);
          setQuantity(1);
          setSearchTerm('');
        }
      } catch (error) {
        console.error('Erro ao buscar produto:', error);
      }
    }
  };

  const addToCart = (product: Product, qty: number = 1) => {
    if (!currentCashSession) {
      alert('É necessário abrir um caixa para realizar vendas');
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
        precoUnitario: product.preco,
        desconto: 0,
        total: qty * product.preco
      };
      setCart([...cart, newItem]);
    }

    setSelectedProduct(null);
    setQuantity(1);
  };

  const removeFromCart = (produtoId: string) => {
    setCart(cart.filter(item => item.produtoId !== produtoId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedProduct(null);
    setQuantity(1);
  };

  const getTotalCart = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const handlePaymentComplete = async (payments: PaymentMethod[], troco: number) => {
    if (!user || !currentCashSession) return;

    try {
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

      const newSale = await db.createSale(sale);
      setLastSale(newSale);
      clearCart();
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      loadData();
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      alert('Erro ao finalizar venda');
    }
  };

  return (
    <div className={`h-screen flex flex-col ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800' 
        : 'bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100'
    }`}>
      {/* Header */}
      <div className={`shadow-xl p-4 border-b-2 ${
        theme === 'dark' ? 'bg-slate-800 border-orange-500' : 'bg-white border-blue-500'
      }`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-slate-600 text-white hover:bg-slate-700"
            >
              <ArrowLeft size={20} />
              Voltar
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-primary">
                <ShoppingCart className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">PDV BANCA</h1>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-slate-600'}`}>
                  {currentCashSession?.caixa || 'Nenhum caixa selecionado'}
                </p>
              </div>
            </div>
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

      {/* Área Principal */}
      <div className="flex-1 flex p-4 gap-4 overflow-hidden">
        {/* Busca e Produto */}
        <div className="w-1/3 flex flex-col gap-4">
          <div className={`rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="text-white p-3 rounded-t-xl flex items-center gap-2 bg-primary">
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
                      ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-400' 
                      : 'bg-white border-blue-300 text-gray-800 focus:border-blue-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {selectedProduct && (
            <div className={`rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="text-white p-3 rounded-t-xl flex items-center gap-2 bg-primary">
                <Package size={20} />
                <h3 className="font-bold">PRODUTO SELECIONADO</h3>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{selectedProduct.nome}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>Código: <span className="font-bold">{selectedProduct.codigo}</span></div>
                  <div>Estoque: <span className="font-bold">{selectedProduct.estoque}</span></div>
                  <div>Preço: <span className="font-bold">R$ {selectedProduct.preco.toFixed(2)}</span></div>
                  <div>Categoria: <span className="font-bold">{selectedProduct.categoria}</span></div>
                </div>

                <div className="mb-4">
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

                <button
                  onClick={() => addToCart(selectedProduct, quantity)}
                  className="w-full text-white py-3 px-4 rounded-lg font-bold hover:opacity-90 transition-all bg-secondary"
                >
                  ⚡ ADICIONAR
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Carrinho */}
        <div className={`w-1/3 rounded-xl shadow-lg flex flex-col ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
          <div className="text-white p-3 rounded-t-xl flex items-center gap-2 bg-primary">
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
                {cart.map((item) => (
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
                      <span className="font-bold text-secondary">
                        R$ {item.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Totais e Ações */}
        <div className="w-1/3 flex flex-col gap-4">
          <div className={`rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="text-white p-3 rounded-t-xl flex items-center gap-2 bg-primary">
              <Calculator size={20} />
              <h3 className="font-bold">TOTAL</h3>
            </div>
            <div className="p-6">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2 text-primary">
                  R$ {getTotalCart().toFixed(2)}
                </div>
                <div className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-slate-500'}`}>
                  {cart.length} {cart.length === 1 ? 'item' : 'itens'}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {cart.length > 0 && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full text-white py-4 px-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg bg-secondary"
              >
                💳 FINALIZAR VENDA
              </button>
            )}
            
            <button
              onClick={clearCart}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-green-700 transition-all"
            >
              🗑️ NOVA VENDA
            </button>
          </div>

          <div className={`rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="text-white p-2 rounded-t-xl flex items-center gap-2 bg-primary">
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

      {/* Footer */}
      <div className={`p-2 text-center border-t ${
        theme === 'dark' ? 'bg-slate-900 border-slate-700 text-blue-300' : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
        <p className="text-xs">
          Powered by <span className="font-bold text-secondary">CYBERPIU</span> • 
          PDV - BANCA v1.0.0
        </p>
      </div>

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

export default PDVScreen;