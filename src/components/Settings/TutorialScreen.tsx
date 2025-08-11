import React, { useState } from 'react';
import { BookOpen, Download, FileText, Search, HelpCircle, ChevronDown, ChevronRight, CheckCircle, AlertTriangle, Info, Coffee, Zap, Shield, ShoppingCart, DollarSign, Package, Users, Settings, Save, Phone, Globe, Mail } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TutorialScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedFaqs, setExpandedFaqs] = useState<string[]>([]);
  const [selectedTutorial, setSelectedTutorial] = useState<'basic' | 'advanced' | 'admin'>('basic');

  // Carregar dados da empresa
  const companyDataStr = localStorage.getItem('company_data');
  const companyData = companyDataStr ? JSON.parse(companyDataStr) : null;
  const companyLogo = localStorage.getItem('company_logo');

  const toggleFaq = (id: string) => {
    setExpandedFaqs(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 20;
      let pageNumber = 1;
      
      // Função para adicionar cabeçalho
      const addHeader = () => {
        // Cabeçalho com dados da empresa (apenas se informados)
        if (companyData && (companyData.nomeFantasia || companyData.razaoSocial)) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(companyData.nomeFantasia || companyData.razaoSocial, 20, 10);
        }
      };
      
      // Função para adicionar rodapé
      const addFooter = () => {
        // Linha decorativa
        doc.setDrawColor(234, 88, 12); // Cor secundária
        doc.setLineWidth(0.5);
        doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Página ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text('Powered by CYBERPIU', pageWidth - 20, pageHeight - 10, { align: 'right' });
        doc.text(format(new Date(), 'dd/MM/yyyy', { locale: ptBR }), 20, pageHeight - 10, { align: 'left' });
      };
      
      // Função para verificar se precisa de nova página
      const checkNewPage = (height: number = 10) => {
        if (yPosition + height > pageHeight - 20) {
          addFooter();
          doc.addPage();
          pageNumber++;
          yPosition = 20;
          addHeader();
        }
      };
      
      // Adicionar capa elegante
      // Fundo gradiente
      const addGradientBackground = () => {
        // Desenhar retângulos com opacidade decrescente para simular gradiente
        const primaryColor = [13, 33, 79]; // RGB da cor primária
        const secondaryColor = [234, 88, 12]; // RGB da cor secundária
        
        for (let i = 0; i < 20; i++) {
          const ratio = i / 20;
          const r = Math.floor(primaryColor[0] * (1 - ratio) + secondaryColor[0] * ratio);
          const g = Math.floor(primaryColor[1] * (1 - ratio) + secondaryColor[1] * ratio);
          const b = Math.floor(primaryColor[2] * (1 - ratio) + secondaryColor[2] * ratio);
          
          doc.setFillColor(r, g, b);
          doc.rect(0, (pageHeight / 20) * i, pageWidth, pageHeight / 20 + 1, 'F');
        }
        
        // Adicionar overlay para melhorar legibilidade
        doc.setFillColor(0, 0, 0);
        doc.setGState(new doc.GState({ opacity: 0.3 }));
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        doc.setGState(new doc.GState({ opacity: 1 }));
      };
      
      addGradientBackground();
      
      // Adicionar logo se existir
      if (companyLogo) {
        try {
          // Círculo branco para o fundo do logo
          doc.setFillColor(255, 255, 255);
          doc.circle(pageWidth / 2, 70, 30, 'F');
          
          // Logo
          doc.addImage(companyLogo, 'JPEG', pageWidth / 2 - 25, 45, 50, 50);
        } catch (e) {
          console.error('Erro ao adicionar logo:', e);
          
          // Fallback se o logo falhar
          doc.setFillColor(255, 255, 255);
          doc.circle(pageWidth / 2, 70, 30, 'F');
          
          doc.setFillColor(13, 33, 79);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(24);
          doc.setTextColor(13, 33, 79);
          doc.text('PDV', pageWidth / 2, 75, { align: 'center' });
        }
      } else {
        // Desenhar um ícone elegante
        doc.setFillColor(255, 255, 255);
        doc.circle(pageWidth / 2, 70, 30, 'F');
        
        doc.setFillColor(13, 33, 79);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(13, 33, 79);
        doc.text('PDV', pageWidth / 2, 75, { align: 'center' });
      }
      
      // Título do tutorial com estilo moderno
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(38);
      doc.setFont('helvetica', 'bold');
      doc.text('MANUAL DO USUÁRIO', pageWidth / 2, 140, { align: 'center' });
      
      // Linha decorativa
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(1);
      doc.line(pageWidth / 2 - 60, 150, pageWidth / 2 + 60, 150);
      
      // Subtítulo
      doc.setFontSize(22);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema PDV Banca de Jornal', pageWidth / 2, 170, { align: 'center' });
      
      // Tipo de tutorial com badge estilizado
      const tutorialTypeText = selectedTutorial === 'basic' ? 'TUTORIAL BÁSICO' : 
                              selectedTutorial === 'advanced' ? 'TUTORIAL AVANÇADO' : 
                              'TUTORIAL ADMINISTRATIVO';
      
      // Fundo do badge
      doc.setFillColor(234, 88, 12); // Cor secundária
      doc.roundedRect(pageWidth / 2 - 50, 185, 100, 20, 5, 5, 'F');
      
      // Texto do badge
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(tutorialTypeText, pageWidth / 2, 198, { align: 'center' });
      
      // Data de geração com estilo
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${format(new Date(), 'dd MMMM yyyy', { locale: ptBR })}`, pageWidth / 2, 230, { align: 'center' });
      
      // Informações da empresa com estilo
      if (companyData) {
        let companyInfo = '';
        if (companyData.nomeFantasia) companyInfo += companyData.nomeFantasia;
        if (companyData.cnpj) companyInfo += companyInfo ? ` • CNPJ: ${companyData.cnpj}` : `CNPJ: ${companyData.cnpj}`;
        
        if (companyInfo) {
          doc.setFontSize(10);
          doc.text(companyInfo, pageWidth / 2, 245, { align: 'center' });
        }
      }
      
      // Rodapé da capa estilizado
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.line(40, pageHeight - 30, pageWidth - 40, pageHeight - 30);
      
      doc.setFontSize(10);
      doc.text('© 2024 CYBERPIU. Todos os direitos reservados.', pageWidth / 2, pageHeight - 20, { align: 'center' });
      
      // Nova página para índice com estilo
      doc.addPage();
      pageNumber++;
      yPosition = 20;
      
      // Fundo para o índice
      doc.setFillColor(252, 252, 252);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Título do índice com estilo
      doc.setTextColor(13, 33, 79); // Cor primária
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('ÍNDICE', pageWidth / 2, yPosition, { align: 'center' });
      
      // Linha decorativa
      doc.setDrawColor(234, 88, 12); // Cor secundária
      doc.setLineWidth(1);
      doc.line(pageWidth / 2 - 30, yPosition + 5, pageWidth / 2 + 30, yPosition + 5);
      
      yPosition += 25;
      
      // Conteúdo do índice com estilo
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      const indexItems = getTutorialContent().map((section, index) => ({
        title: section.title,
        page: index + 3 // Página da capa + página do índice + 1
      }));
      
      indexItems.forEach((item, index) => {
        // Número de seção com estilo
        doc.setFillColor(234, 88, 12); // Cor secundária
        doc.setTextColor(13, 33, 79); // Cor primária
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}.`, 30, yPosition);
        
        // Título da seção
        doc.setFont('helvetica', 'normal');
        doc.text(`${item.title}`, 50, yPosition);
        
        // Número de página com estilo
        doc.setFont('helvetica', 'bold');
        doc.text(`${item.page}`, pageWidth - 30, yPosition);
        
        // Linha pontilhada estilizada
        const textWidth = doc.getTextWidth(`${item.title}`);
        const pageNumWidth = doc.getTextWidth(`${item.page}`);
        const dotsStart = 55 + textWidth;
        const dotsEnd = pageWidth - 30 - pageNumWidth - 5;
        
        if (dotsEnd > dotsStart) {
          doc.setDrawColor(200, 200, 200);
          doc.setLineDashPattern([1, 2], 0);
          doc.line(dotsStart, yPosition, dotsEnd, yPosition);
          doc.setLineDashPattern([0], 0);
        }
        
        yPosition += 20;
        checkNewPage();
      });
      
      // Adicionar rodapé ao índice
      addFooter();
      
      // Conteúdo do tutorial com estilo de e-book
      getTutorialContent().forEach((section, sectionIndex) => {
        doc.addPage();
        pageNumber++;
        yPosition = 30;
        
        // Fundo para as páginas de conteúdo
        doc.setFillColor(252, 252, 252);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        
        // Cabeçalho da página
        addHeader();
        
        // Título da seção com estilo
        doc.setTextColor(13, 33, 79); // Cor primária
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(`${sectionIndex + 1}. ${section.title}`, 20, yPosition);
        yPosition += 15;
        
        // Linha decorativa
        doc.setDrawColor(234, 88, 12); // Cor secundária
        doc.setLineWidth(1);
        doc.line(20, yPosition, pageWidth - 20, yPosition);
        yPosition += 15;
        
        // Descrição da seção com estilo
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        
        const descriptionLines = doc.splitTextToSize(section.description, pageWidth - 40);
        descriptionLines.forEach(line => {
          checkNewPage();
          doc.text(line, 20, yPosition);
          yPosition += 6;
        });
        
        yPosition += 15;
        
        // Tópicos da seção com estilo
        section.topics.forEach((topic, topicIndex) => {
          checkNewPage(25);
          
          // Título do tópico com estilo
          doc.setTextColor(13, 33, 79); // Cor primária
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(`${sectionIndex + 1}.${topicIndex + 1}. ${topic.title}`, 20, yPosition);
          yPosition += 10;
          
          // Conteúdo do tópico com estilo
          doc.setTextColor(60, 60, 60);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          
          const contentLines = doc.splitTextToSize(topic.content, pageWidth - 40);
          contentLines.forEach(line => {
            checkNewPage();
            doc.text(line, 20, yPosition);
            yPosition += 6;
          });
          
          // Dicas ou observações com estilo
          if (topic.tips) {
            checkNewPage(20);
            yPosition += 5;
            
            // Fundo estilizado para a dica
            doc.setFillColor(240, 248, 255); // Azul muito claro
            doc.roundedRect(20, yPosition - 5, pageWidth - 40, 25 + (topic.tips.length * 6), 5, 5, 'F');
            
            // Título da dica com estilo
            doc.setTextColor(70, 130, 180); // Azul médio
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('DICA:', 30, yPosition + 5);
            
            // Conteúdo da dica com estilo
            doc.setTextColor(60, 60, 60);
            doc.setFont('helvetica', 'italic');
            
            const tipLines = doc.splitTextToSize(topic.tips, pageWidth - 80);
            tipLines.forEach((line, i) => {
              doc.text(line, 60, yPosition + 5 + (i * 6));
            });
            
            yPosition += 25 + (tipLines.length * 6);
          }
          
          yPosition += 15;
        });
        
        // Adicionar rodapé
        addFooter();
      });
      
      // Salvar o PDF
      const tutorialType = selectedTutorial === 'basic' ? 'basico' : 
                          selectedTutorial === 'advanced' ? 'avancado' : 
                          'administrativo';
      doc.save(`tutorial-${tutorialType}-${format(new Date(), 'ddMMyyyy')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o tutorial. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getTutorialContent = () => {
    // Conteúdo básico - disponível para todos
    const basicContent = [
      {
        title: 'Introdução ao Sistema',
        description: 'O Sistema PDV Banca de Jornal é uma solução completa para gerenciamento de vendas, estoque e controle financeiro para bancas de jornal e pequenos comércios. Este tutorial apresenta as funcionalidades básicas do sistema.',
        topics: [
          {
            title: 'Visão Geral',
            content: 'O sistema possui uma interface intuitiva com menu lateral para navegação entre os módulos. A tela inicial apresenta informações resumidas e acesso rápido às principais funcionalidades.',
            tips: 'Você pode personalizar a aparência do sistema na seção "Aparência" do menu de configurações.'
          },
          {
            title: 'Acesso ao Sistema',
            content: 'Para acessar o sistema, utilize o nome de usuário e senha fornecidos pelo administrador. O sistema possui diferentes níveis de acesso: Vendedor, Gerente e Administrador, cada um com permissões específicas.',
            tips: 'Por segurança, altere sua senha periodicamente e nunca compartilhe suas credenciais de acesso.'
          }
        ]
      },
      {
        title: 'Realizando Vendas',
        description: 'O módulo PDV (Ponto de Venda) permite realizar vendas de forma rápida e eficiente, com suporte a diferentes formas de pagamento e emissão de cupom não fiscal.',
        topics: [
          {
            title: 'Acessando o PDV',
            content: 'Clique no ícone "PDV" no menu lateral para acessar a tela de vendas. Antes de iniciar as vendas, certifique-se de que um caixa esteja aberto.',
            tips: 'Utilize a tecla F7 para focar rapidamente na busca de produtos.'
          },
          {
            title: 'Adicionando Produtos',
            content: 'Digite o código, nome ou código de barras do produto no campo de busca e pressione Enter. Selecione a quantidade desejada e clique em "Adicionar" ou pressione F8.',
            tips: 'Você pode alterar a quantidade usando os botões "QTD+" e "QTD-" ou digitando diretamente no campo de quantidade.'
          },
          {
            title: 'Finalizando a Venda',
            content: 'Após adicionar todos os produtos, clique em "Finalizar Venda" ou pressione F10. Selecione a forma de pagamento, informe o valor recebido (se for dinheiro) e confirme a venda.',
            tips: 'O sistema calcula automaticamente o troco quando o pagamento é em dinheiro.'
          },
          {
            title: 'Emitindo o Cupom',
            content: 'Após finalizar a venda, o sistema exibirá o cupom não fiscal. Você pode imprimir o cupom ou salvá-lo como PDF.',
            tips: 'Os cupons ficam armazenados no sistema e podem ser consultados posteriormente no módulo de relatórios.'
          }
        ]
      },
      {
        title: 'Consulta de Produtos',
        description: 'O módulo de Produtos permite consultar, cadastrar e gerenciar o estoque de produtos da banca.',
        topics: [
          {
            title: 'Pesquisando Produtos',
            content: 'Utilize o campo de busca para encontrar produtos por nome, código ou código de barras. Você também pode filtrar por categoria.',
            tips: 'A busca é dinâmica e os resultados são atualizados conforme você digita.'
          },
          {
            title: 'Visualizando Detalhes',
            content: 'Clique em um produto na lista para visualizar seus detalhes, como preço, estoque atual e categoria.',
            tips: 'Produtos com estoque abaixo do mínimo são destacados com um ícone de alerta.'
          }
        ]
      }
    ];
    
    // Conteúdo avançado - para gerentes e administradores
    const advancedContent = [
      {
        title: 'Gerenciamento de Estoque',
        description: 'O controle de estoque é essencial para o bom funcionamento do negócio. O sistema permite o acompanhamento em tempo real do estoque de produtos.',
        topics: [
          {
            title: 'Cadastro de Produtos',
            content: 'Para cadastrar um novo produto, acesse o módulo "Produtos" e clique em "Novo Produto". Preencha os campos obrigatórios como nome, código, preço, categoria e estoque inicial.',
            tips: 'Defina um estoque mínimo para receber alertas quando o produto estiver com estoque baixo.'
          },
          {
            title: 'Atualização de Estoque',
            content: 'O estoque é atualizado automaticamente a cada venda. Para ajustes manuais, edite o produto e altere o campo "Estoque Atual".',
            tips: 'Realize inventários periódicos para garantir a precisão do estoque no sistema.'
          },
          {
            title: 'Alertas de Estoque',
            content: 'O sistema exibe alertas para produtos com estoque abaixo do mínimo definido. Estes alertas aparecem no Dashboard e na lista de produtos.',
            tips: 'Configure as notificações para receber alertas por email quando o estoque estiver baixo.'
          }
        ]
      },
      {
        title: 'Controle Financeiro',
        description: 'O módulo Financeiro permite o controle completo das movimentações financeiras, incluindo entradas, saídas, despesas e relatórios.',
        topics: [
          {
            title: 'Abertura e Fechamento de Caixa',
            content: 'Para iniciar as operações do dia, é necessário abrir o caixa informando o valor inicial. Ao final do expediente, realize o fechamento informando o valor em caixa para conferência.',
            tips: 'O sistema calcula automaticamente a diferença entre o valor esperado e o valor informado no fechamento.'
          },
          {
            title: 'Registro de Movimentações',
            content: 'Além das vendas, você pode registrar outras entradas (receitas, suprimentos) e saídas (despesas, sangrias) de caixa.',
            tips: 'Categorize corretamente as movimentações para facilitar a análise financeira posterior.'
          },
          {
            title: 'Controle de Despesas',
            content: 'Cadastre e acompanhe as despesas fixas e variáveis do negócio. É possível definir despesas recorrentes e datas de vencimento.',
            tips: 'Utilize o campo de observações para registrar informações adicionais sobre a despesa.'
          }
        ]
      },
      {
        title: 'Relatórios Gerenciais',
        description: 'O sistema oferece diversos relatórios para análise do desempenho do negócio, auxiliando na tomada de decisões.',
        topics: [
          {
            title: 'Relatório de Vendas',
            content: 'Apresenta o histórico de vendas por período, com informações sobre produtos vendidos, formas de pagamento e totais.',
            tips: 'Utilize os filtros de data para analisar períodos específicos, como dias da semana ou horários de pico.'
          },
          {
            title: 'Relatório de Produtos',
            content: 'Mostra os produtos mais vendidos, lucratividade por produto e alertas de estoque.',
            tips: 'Identifique os produtos com maior giro para otimizar seu estoque e negociar melhores condições com fornecedores.'
          },
          {
            title: 'Relatório Financeiro',
            content: 'Apresenta o fluxo de caixa, receitas, despesas e lucro líquido por período.',
            tips: 'Compare os resultados com períodos anteriores para identificar tendências e sazonalidades.'
          },
          {
            title: 'Exportação de Dados',
            content: 'Todos os relatórios podem ser exportados em formato PDF para análise externa ou arquivamento.',
            tips: 'Programe a geração automática de relatórios mensais para acompanhamento consistente dos resultados.'
          }
        ]
      }
    ];
    
    // Conteúdo administrativo - apenas para administradores
    const adminContent = [
      {
        title: 'Configurações do Sistema',
        description: 'O módulo de Configurações permite personalizar o sistema de acordo com as necessidades do negócio e gerenciar usuários e permissões.',
        topics: [
          {
            title: 'Dados da Empresa',
            content: 'Cadastre as informações da empresa, como razão social, CNPJ, endereço e logo. Estas informações serão exibidas nos relatórios e cupons.',
            tips: 'Mantenha os dados da empresa sempre atualizados, especialmente informações de contato.'
          },
          {
            title: 'Aparência',
            content: 'Personalize as cores do sistema, tema (claro ou escuro) e logo. As alterações são aplicadas em tempo real para todos os usuários.',
            tips: 'Escolha cores que representem a identidade visual da sua empresa.'
          },
          {
            title: 'Backup e Restauração',
            content: 'Realize backups periódicos dos dados do sistema para evitar perdas em caso de problemas. O backup pode ser configurado para execução automática.',
            tips: 'Armazene os backups em locais seguros e diferentes do computador principal.'
          }
        ]
      },
      {
        title: 'Gestão de Usuários',
        description: 'O controle de acesso ao sistema é fundamental para a segurança das informações. O módulo de Usuários permite criar e gerenciar contas de usuários com diferentes níveis de permissão.',
        topics: [
          {
            title: 'Cadastro de Usuários',
            content: 'Para cadastrar um novo usuário, acesse "Configurações > Usuários" e clique em "Novo Usuário". Defina nome, login, senha e tipo de usuário (Vendedor, Gerente ou Administrador).',
            tips: 'Crie senhas fortes e oriente os usuários a alterá-las no primeiro acesso.'
          },
          {
            title: 'Permissões de Acesso',
            content: 'Cada tipo de usuário possui permissões específicas: Vendedores têm acesso apenas ao PDV, Gerentes podem acessar relatórios e estoque, e Administradores têm acesso completo.',
            tips: 'Siga o princípio do menor privilégio: conceda apenas as permissões necessárias para cada função.'
          },
          {
            title: 'Auditoria de Ações',
            content: 'O sistema registra as principais ações dos usuários, como vendas, alterações de estoque e movimentações financeiras, identificando o usuário responsável.',
            tips: 'Revise periodicamente os logs de auditoria para identificar possíveis irregularidades.'
          }
        ]
      },
      {
        title: 'Fornecedores e Compras',
        description: 'O gerenciamento de fornecedores e compras permite controlar o relacionamento com parceiros comerciais e o processo de reposição de estoque.',
        topics: [
          {
            title: 'Cadastro de Fornecedores',
            content: 'Registre informações completas dos fornecedores, como razão social, CNPJ, contatos e endereço. Associe produtos aos respectivos fornecedores.',
            tips: 'Mantenha um histórico de interações com cada fornecedor para referência futura.'
          },
          {
            title: 'Pedidos de Compra',
            content: 'Crie pedidos de compra para fornecedores, especificando produtos, quantidades e valores. Acompanhe o status dos pedidos até a entrega.',
            tips: 'Configure alertas automáticos para produtos com estoque baixo, facilitando a decisão de reposição.'
          },
          {
            title: 'Recebimento de Mercadorias',
            content: 'Ao receber os produtos, confira a nota fiscal com o pedido de compra e registre a entrada no estoque. O sistema atualiza automaticamente o estoque disponível.',
            tips: 'Verifique sempre a qualidade e a quantidade dos produtos recebidos antes de confirmar o recebimento no sistema.'
          }
        ]
      },
      {
        title: 'Manutenção do Sistema',
        description: 'A manutenção regular do sistema é essencial para garantir seu bom funcionamento e a integridade dos dados.',
        topics: [
          {
            title: 'Atualização do Sistema',
            content: 'Mantenha o sistema sempre atualizado com as últimas versões disponibilizadas pela CYBERPIU. As atualizações podem incluir novas funcionalidades, correções e melhorias de segurança.',
            tips: 'Realize um backup completo antes de aplicar qualquer atualização.'
          },
          {
            title: 'Limpeza de Dados',
            content: 'Periodicamente, avalie a necessidade de arquivar ou remover dados antigos que não são mais necessários para operação diária, como vendas e movimentações de períodos passados.',
            tips: 'Antes de remover qualquer dado, certifique-se de que ele foi devidamente arquivado em um backup.'
          },
          {
            title: 'Monitoramento de Desempenho',
            content: 'Acompanhe o desempenho do sistema, especialmente em momentos de pico de uso. Identifique possíveis gargalos e tome medidas preventivas.',
            tips: 'Em caso de lentidão persistente, entre em contato com o suporte técnico da CYBERPIU para diagnóstico e solução.'
          }
        ]
      }
    ];
    
    // Retornar o conteúdo de acordo com o tipo de tutorial selecionado
    switch (selectedTutorial) {
      case 'basic':
        return basicContent;
      case 'advanced':
        return [...basicContent, ...advancedContent];
      case 'admin':
        return [...basicContent, ...advancedContent, ...adminContent];
      default:
        return basicContent;
    }
  };

  // FAQs - Perguntas Frequentes
  const faqs = [
    {
      id: 'faq-1',
      category: 'pdv',
      question: 'Como abrir o caixa para iniciar as vendas?',
      answer: 'Para abrir o caixa, acesse o módulo "Controle de Caixa" no menu lateral e clique no botão "Abrir Caixa". Selecione o caixa desejado, informe o valor inicial em dinheiro e clique em "Abrir Caixa".'
    },
    {
      id: 'faq-2',
      category: 'pdv',
      question: 'Como cancelar uma venda já finalizada?',
      answer: 'Acesse o módulo "Vendas", localize a venda desejada na lista, clique no botão de opções (três pontos) e selecione "Cancelar Venda". Informe o motivo do cancelamento e confirme. Apenas usuários com permissão podem realizar esta operação.'
    },
    {
      id: 'faq-3',
      category: 'produtos',
      question: 'Como cadastrar um novo produto?',
      answer: 'Acesse o módulo "Produtos" no menu lateral e clique no botão "Novo Produto". Preencha os campos obrigatórios (nome, código, preço, categoria e estoque) e clique em "Criar Produto".'
    },
    {
      id: 'faq-4',
      category: 'produtos',
      question: 'Como atualizar o estoque de um produto?',
      answer: 'Acesse o módulo "Produtos", localize o produto desejado, clique no botão "Editar", atualize o campo "Estoque Atual" e salve as alterações. O sistema registrará esta operação no histórico de movimentações.'
    },
    {
      id: 'faq-5',
      category: 'financeiro',
      question: 'Como registrar uma despesa?',
      answer: 'Acesse o módulo "Financeiro" no menu lateral e clique no botão "Nova Despesa". Preencha os campos obrigatórios (descrição, valor, data de vencimento) e clique em "Criar Despesa".'
    },
    {
      id: 'faq-6',
      category: 'financeiro',
      question: 'Como fechar o caixa no final do dia?',
      answer: 'Acesse o módulo "Controle de Caixa" e clique no botão "Fechar Caixa". Informe o valor em dinheiro contado fisicamente, adicione observações se necessário e confirme o fechamento.'
    },
    {
      id: 'faq-7',
      category: 'relatorios',
      question: 'Como gerar um relatório de vendas por período?',
      answer: 'Acesse o módulo "Relatórios", selecione "Relatório de Vendas", defina o período desejado (dia, semana, mês ou personalizado) e clique em "Gerar Relatório". O sistema gerará um PDF que pode ser salvo ou impresso.'
    },
    {
      id: 'faq-8',
      category: 'sistema',
      question: 'Como realizar backup dos dados?',
      answer: 'Acesse "Configurações > Backup" no menu lateral e clique em "Criar Backup". O sistema gerará um arquivo que deve ser salvo em local seguro. Você também pode configurar backups automáticos periódicos.'
    },
    {
      id: 'faq-9',
      category: 'sistema',
      question: 'Como adicionar um novo usuário ao sistema?',
      answer: 'Acesse "Configurações > Usuários" no menu lateral e clique em "Novo Usuário". Preencha os dados do usuário, defina o tipo (Vendedor, Gerente ou Administrador) e clique em "Criar Usuário".'
    },
    {
      id: 'faq-10',
      category: 'sistema',
      question: 'Como alterar as cores do sistema?',
      answer: 'Acesse "Configurações > Aparência" no menu lateral. Utilize o seletor de cores para escolher as cores primária e secundária do sistema. Clique em "Aplicar Cores" para salvar as alterações.'
    }
  ];

  // Filtrar FAQs com base na busca
  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Verificar permissões para tutoriais avançados e administrativos
  const canAccessAdvanced = user?.tipo === 'gerente' || user?.tipo === 'administrador';
  const canAccessAdmin = user?.tipo === 'administrador';

  // Ícones para categorias de FAQ
  const getFaqCategoryIcon = (category: string) => {
    switch (category) {
      case 'pdv': return <ShoppingCart size={18} className="text-blue-600" />;
      case 'produtos': return <Package size={18} className="text-green-600" />;
      case 'financeiro': return <DollarSign size={18} className="text-orange-600" />;
      case 'relatorios': return <FileText size={18} className="text-purple-600" />;
      case 'sistema': return <Settings size={18} className="text-gray-600" />;
      default: return <HelpCircle size={18} className="text-gray-600" />;
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto p-8">
        {/* Header Moderno */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl ${
                theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-100'
              }`}>
                <BookOpen size={40} className="text-primary" />
              </div>
              <div>
                <h1 className="text-5xl font-light text-primary mb-3">Tutorial</h1>
                <p className={`text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Aprenda a utilizar o sistema PDV Banca
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Seleção de Tutorial */}
        <div className={`p-8 rounded-3xl shadow-xl mb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <FileText size={24} className="text-primary" />
            Tutoriais Disponíveis
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all hover:scale-105 ${
                selectedTutorial === 'basic'
                  ? 'border-primary bg-primary/10'
                  : theme === 'dark' 
                    ? 'border-gray-700 hover:border-gray-600' 
                    : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedTutorial('basic')}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
                  <Coffee size={24} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Tutorial Básico</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Para iniciantes
                  </p>
                </div>
              </div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Introdução ao sistema, navegação básica e operações de venda.
              </p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  Todos os usuários
                </span>
                <span className="text-xs text-gray-500">3 seções</span>
              </div>
            </div>
            
            <div 
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all hover:scale-105 ${
                !canAccessAdvanced 
                  ? 'opacity-50 cursor-not-allowed' 
                  : selectedTutorial === 'advanced'
                    ? 'border-primary bg-primary/10'
                    : theme === 'dark' 
                      ? 'border-gray-700 hover:border-gray-600' 
                      : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => canAccessAdvanced && setSelectedTutorial('advanced')}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                  <Zap size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Tutorial Avançado</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Para gerentes
                  </p>
                </div>
              </div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Gestão de estoque, controle financeiro e relatórios gerenciais.
              </p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  Gerentes e Administradores
                </span>
                <span className="text-xs text-gray-500">6 seções</span>
              </div>
            </div>
            
            <div 
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all hover:scale-105 ${
                !canAccessAdmin 
                  ? 'opacity-50 cursor-not-allowed' 
                  : selectedTutorial === 'admin'
                    ? 'border-primary bg-primary/10'
                    : theme === 'dark' 
                      ? 'border-gray-700 hover:border-gray-600' 
                      : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => canAccessAdmin && setSelectedTutorial('admin')}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-100">
                  <Shield size={24} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Tutorial Administrativo</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Para administradores
                  </p>
                </div>
              </div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Configurações avançadas, gestão de usuários e manutenção do sistema.
              </p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                  Apenas Administradores
                </span>
                <span className="text-xs text-gray-500">10 seções</span>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              onClick={generatePDF}
              disabled={isGenerating}
              className="bg-primary text-white px-8 py-4 rounded-2xl hover:opacity-90 flex items-center gap-3 font-medium text-lg shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Baixar Tutorial em PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Perguntas Frequentes */}
        <div className={`p-8 rounded-3xl shadow-xl mb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <HelpCircle size={24} className="text-secondary" />
              Perguntas Frequentes
            </h2>
            
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar perguntas frequentes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 transition-all ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-primary' 
                    : 'bg-white border-gray-300 text-gray-800 focus:border-primary'
                }`}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map(faq => (
                <div 
                  key={faq.id}
                  className={`border-2 rounded-xl overflow-hidden transition-all ${
                    expandedFaqs.includes(faq.id)
                      ? theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                      : theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className={`w-full flex items-center justify-between p-5 text-left ${
                      expandedFaqs.includes(faq.id)
                        ? theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getFaqCategoryIcon(faq.category)}
                      <span className="font-bold">{faq.question}</span>
                    </div>
                    {expandedFaqs.includes(faq.id) ? (
                      <ChevronDown size={20} />
                    ) : (
                      <ChevronRight size={20} />
                    )}
                  </button>
                  
                  {expandedFaqs.includes(faq.id) && (
                    <div className={`p-5 border-t ${
                      theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <p className="text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className={`p-8 text-center rounded-xl ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <HelpCircle size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">Nenhuma pergunta encontrada</p>
                <p className="text-sm text-gray-500">
                  Tente usar termos diferentes na sua busca
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Informações de Suporte */}
        <div className={`p-8 rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Info size={24} className="text-primary" />
            Suporte e Ajuda
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                  <Mail size={24} className="text-blue-600" />
                </div>
                <h3 className="font-bold text-lg">Email de Suporte</h3>
              </div>
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Envie suas dúvidas ou problemas para nossa equipe de suporte.
              </p>
              <a 
                href="mailto:suporte@cyberpiu.com.br" 
                className="inline-block text-primary font-medium hover:underline"
              >
                suporte@cyberpiu.com.br
              </a>
            </div>
            
            <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
                  <Phone size={24} className="text-green-600" />
                </div>
                <h3 className="font-bold text-lg">Telefone</h3>
              </div>
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Atendimento de segunda a sexta, das 8h às 18h.
              </p>
              <a 
                href="tel:+551199999999" 
                className="inline-block text-primary font-medium hover:underline"
              >
                (11) 9999-9999
              </a>
            </div>
            
            <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-100">
                  <Globe size={24} className="text-purple-600" />
                </div>
                <h3 className="font-bold text-lg">Site</h3>
              </div>
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Acesse nosso site para mais informações e recursos.
              </p>
              <a 
                href="https://www.cyberpiu.com.br" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block text-primary font-medium hover:underline"
              >
                www.cyberpiu.com.br
              </a>
            </div>
          </div>
          
          <div className={`mt-8 p-6 rounded-xl border-l-4 border-blue-500 ${
            theme === 'dark' ? 'bg-blue-900/20 text-blue-200' : 'bg-blue-50 text-blue-800'
          }`}>
            <div className="flex items-start gap-4">
              <AlertTriangle size={24} className="flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold mb-2">Informação Importante</h4>
                <p className="text-sm">
                  Este tutorial abrange as principais funcionalidades do sistema PDV Banca de Jornal. Para informações mais detalhadas ou suporte técnico, entre em contato com nossa equipe de atendimento.
                </p>
                <p className="text-sm mt-2">
                  Mantenha seu sistema sempre atualizado para ter acesso às últimas funcionalidades e correções de segurança.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Créditos CYBERPIU */}
        <div className={`mt-8 p-4 text-center border-t ${
          theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'
        }`}>
          <p className="text-sm">
            Tutorial do Sistema • Powered by <span className="font-bold" style={{ color: '#ea580c' }}>CYBERPIU</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TutorialScreen;