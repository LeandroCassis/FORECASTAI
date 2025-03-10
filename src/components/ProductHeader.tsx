import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { History, User, LineChart, Loader2, BarChart, InfoIcon, Banknote, CircleDollarSignIcon, WarehouseIcon, CpuIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useForecastMutations } from '@/hooks/useForecastMutations';
import { useForecastData } from '@/hooks/useForecastData';
import { config } from '@/config/env';

interface ProductHeaderProps {
  produto: string;
}

const ProductHeader: React.FC<ProductHeaderProps> = ({
  produto
}) => {
  const [isGeneratingForecast, setIsGeneratingForecast] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Utilizando o hook useForecastData para obter configurações de meses e grupos
  const { grupos, monthConfigurations } = useForecastData(produto);
  
  const {
    data: productData
  } = useQuery({
    queryKey: ['product-details', produto],
    queryFn: async () => {
      console.log('Fetching product details for:', produto);
      const response = await fetch(`/api/produtos/${encodeURIComponent(produto)}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      console.log('Product details fetched:', data);
      return data;
    }
  });

  const { updateMutation } = useForecastMutations(productData?.codigo);

  // Fetch the last update information
  const { data: lastUpdateInfo } = useQuery({
    queryKey: ['forecast-last-update', productData?.codigo],
    queryFn: async () => {
      if (!productData?.codigo) return null;
      
      const response = await fetch(`/api/forecast-values-history/${encodeURIComponent(productData.codigo)}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      // Return the first item (most recent update) if available
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!productData?.codigo,
  });

  // Format the last update timestamp if it exists
  const formattedLastUpdate = lastUpdateInfo?.modified_at 
    ? format(new Date(lastUpdateInfo.modified_at), 'dd/MM/yyyy HH:mm') 
    : '-';

  // Get user initials from full name or username
  const userInitials = lastUpdateInfo?.user_fullname 
    ? lastUpdateInfo.user_fullname.split(' ').map(name => name[0]).join('').toUpperCase().substring(0, 2)
    : lastUpdateInfo?.username 
      ? lastUpdateInfo.username.substring(0, 2).toUpperCase()
      : '-';

  // Function to generate forecast using DeepSeek API
  const generateForecast = async () => {
    if (!productData?.codigo) {
      toast({
        title: "Erro",
        description: "Dados do produto não disponíveis",
        variant: "destructive"
      });
      return;
    }

    if (!monthConfigurations || !grupos) {
      toast({
        title: "Erro",
        description: "Configurações de previsão não disponíveis",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingForecast(true);
    
    try {
      // Fetch historical sales data
      console.log('Buscando dados de vendas para:', productData.codigo);
      const salesResponse = await fetch(`/api/vendas/${encodeURIComponent(productData.codigo)}`);
      
      // Verificar se a resposta foi bem-sucedida
      if (salesResponse.status === 404) {
        // Resposta 404 indica que não há dados de vendas para este produto
        toast({
          title: "Produto sem histórico",
          description: "Este produto pode ser um lançamento e não possui dados históricos de vendas para fazer previsão utilizando IA.",
          variant: "default"  // Alterado de "warning" para "default"
        });
        return;
      } else if (!salesResponse.ok) {
        throw new Error('Erro ao buscar dados de vendas');
      }
      
      const salesData = await salesResponse.json();
      console.log('Dados de vendas obtidos:', salesData);
      
      // Verificar explicitamente se os dados de venda estão vazios
      if (salesData.length === 0) {
        toast({
          title: "Produto sem histórico",
          description: "Este produto pode ser um lançamento e não possui dados históricos de vendas para fazer previsão utilizando IA.",
          variant: "default"  // Alterado de "warning" para "default"
        });
        return;
      }
      
      // DeepSeek espera dados em um formato específico, vamos preparar os dados
      const formattedSalesData = salesData.map(sale => ({
        date: sale.data,
        quantity: Number(sale.quantidade) || 0,
        revenue: Number(sale.receita) || 0,
        customer: sale.cod_cliente || '',
        invoice: sale.nota || '',
        seller: sale.cod_vendedor || ''
      }));
      
      console.log('Dados formatados para DeepSeek:', formattedSalesData);
      
      // Usar o proxy do servidor para contornar problemas de CORS
      console.log('Chamando API DeepSeek via proxy');
      
      // Preparar os dados para envio através do proxy
      const requestData = {
        apiKey: 'sk-8405d429613b41fa90a4a580b98a6308',
        data: {
          product_code: productData.codigo,
          product_name: produto,
          historical_sales: formattedSalesData,
          forecast_months: 36, // Aumentando para 36 meses para cobrir múltiplos anos
          additional_features: {
            price: productData?.preco_venda || 0,
            stock: productData?.estoque || 0
          }
        }
      };
      
      const deepseekResponse = await fetch('/api/deepseek-proxy/forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      if (!deepseekResponse.ok) {
        const errorData = await deepseekResponse.text();
        console.error('Erro na resposta da API DeepSeek:', errorData);
        throw new Error(`Erro na API DeepSeek: ${deepseekResponse.status} ${deepseekResponse.statusText}`);
      }
      
      const forecast = await deepseekResponse.json();
      console.log('Previsão gerada pela API DeepSeek:', forecast);
      
      const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
      const currentYear = new Date().getFullYear();
      
      // Armazenar todas as atualizações realizadas
      const atualizacoes = [];
      
      // Iterar sobre os anos disponíveis nas configurações
      for (const yearStr in monthConfigurations) {
        const year = parseInt(yearStr);
        if (year >= currentYear) { // Só processa anos atuais e futuros
          const yearConfig = monthConfigurations[year];
          
          // Encontrar o grupo apropriado para o ano
          // Apenas processar linhas de REVISÃO, ignorando PREVISÃO
          const grupoTipo = 'REVISÃO';
          const grupoAno = grupos.find(g => 
            g.ano === year && g.tipo.toUpperCase() === grupoTipo
          );
          
          if (grupoAno) {
            console.log(`Processando ${grupoTipo} para o ano ${year}`);
            
            // Calcular o offset baseado no ano
            const yearOffset = (year - currentYear) * 12;
            
            // Atualizar apenas os meses que não foram realizados
            for (let i = 0; i < months.length; i++) {
              const month = months[i];
              const monthConfig = yearConfig[month];
              
              // Só atualiza se o mês não foi realizado e temos valor de previsão
              if (monthConfig && !monthConfig.realizado) {
                const forecastIndex = yearOffset + i;
                if (forecast.forecast_values && forecast.forecast_values[forecastIndex] !== undefined) {
                  const value = forecast.forecast_values[forecastIndex];
                  console.log(`Atualizando ${year}/${month}: ${value} (não realizado)`);
                  
                  await updateMutation.mutateAsync({ 
                    ano: year, 
                    tipo: grupoAno.tipo, 
                    id_tipo: grupoAno.id_tipo, 
                    mes: month, 
                    valor: Math.round(value),
                    metodo: 'AI'  // Adding metodo field with 'AI' value for DeepSeek API generated forecasts
                  });
                  
                  atualizacoes.push(`${month}/${year}`);
                }
              }
            }
          } else {
            console.log(`Grupo ${grupoTipo} não encontrado para o ano ${year}`);
          }
        }
      }
      
      // Invalidate forecast values cache to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['forecast_values'] });
      
      if (atualizacoes.length > 0) {
        toast({
          title: "Previsão gerada",
          description: `Valores atualizados para os períodos: ${atualizacoes.join(', ')}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Informação",
          description: "Não há períodos para atualização. Todos os meses já estão realizados.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error generating forecast:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao gerar previsão",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingForecast(false);
    }
  };

  return <div className="bg-white/80 backdrop-blur-lg rounded-t-2xl shadow-lg border border-b-0 border-blue-100/50 p-4 pb-3">
      <div className="flex justify-between text-[1rem]">
        <div className="text-center">
          <div className="font-semibold text-transparent -500 mb-0.5 rounded-none ">PRODUTO</div>
          <div className="text-black text-2xl py-0">{produto}</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-black -500 mb-0.5 rounded-none flex items-center justify-center">
            <InfoIcon size={14} className="mr-1" />
            COD PRODUTO
          </div>
          <div className="text-black text-sm">{productData?.codigo || '-'}</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-black -500 mb-0.5 rounded-none flex items-center justify-center">
            <InfoIcon size={14} className="mr-1" />
            MARCA
          </div>
          <div className="text-black text-sm">{productData?.marca || '-'}</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-black -500 mb-0.5 rounded-none flex items-center justify-center">
            <InfoIcon size={14} className="mr-1" />
            FÁBRICA
          </div>
          <div className="text-black text-sm">{productData?.fabrica || '-'}</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-black -500 mb-0.5 rounded-none flex items-center justify-center">
            <Banknote size={14} className="mr-1" />
            FOB
          </div>
          <div className="text-black text-sm">
          {productData?.moedafob && productData?.fob ? `${productData.moedafob} ${productData.fob.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
          </div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-black -500 mb-0.5 rounded-none flex items-center justify-center">
            <CircleDollarSignIcon size={14} className="mr-1" />
            PREÇO VENDA
          </div>
          <div className="text-black text-sm">
          {productData?.preco_venda ? `R$ ${productData.preco_venda.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : '-'}

          </div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-black -500 mb-0.5 rounded-none flex items-center justify-center">
            <History size={14} className="mr-1" />
            ATUALIZAÇÃO FOB
          </div>
          <div className="text-black text-sm">
            {productData?.data_atualizacao_fob ? format(new Date(productData.data_atualizacao_fob), 'dd/MM/yyyy') : '-'}
          </div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-black -500 mb-0.5 rounded-none flex items-center justify-center">
            <WarehouseIcon size={14} className="mr-1" />
            ESTOQUE
          </div>
          <div className="text-black text-sm">
          {productData?.estoque != null ? productData.estoque.toLocaleString('pt-BR') : '-'}

          </div>
        </div>
        
        {/* Nova coluna com data e hora da última atualização */}
        <div className="text-center">
          <div className="font-semibold text-black -500 mb-0.5 rounded-none flex items-center justify-center">
            <History size={14} className="mr-1" />
            ATUALIZAÇÃO
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-black text-sm">
                  {formattedLastUpdate}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Data e hora da última atualização</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Nova coluna com as iniciais do usuário que fez a última atualização */}
        <div className="text-center">
          <div className="font-semibold text-black -500 mb-0.5 rounded-none flex items-center justify-center">
            <User size={14} className="mr-1" />
            RESPONSÁVEL
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-black text-sm">
                  {userInitials !== '-' ? (
                    <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium mx-auto">
                      {userInitials}
                    </div>
                  ) : '-'}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{lastUpdateInfo?.user_fullname || lastUpdateInfo?.username || 'Usuário desconhecido'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Botão para gerar previsão automática */}
        <div className="text-center">
          <div className="font-semibold text-black -500 mb-0.5 rounded-none flex items-center justify-center">
            <CpuIcon size={14} className="mr-1" />
            AUTOMÁTICO
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm"
                  variant="outline"
                  className="h-6 bg-blue-60 border-blue-200 hover:bg-blue-100"
                  onClick={generateForecast}
                  disabled={isGeneratingForecast || !productData?.codigo}
                >
                  {isGeneratingForecast ? (
                    <>
                      <Loader2 size={14} className="mr-1 animate-spin" />
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <span>🤖 AI</span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Gerar previsão automática de vendas via API DeepSeek</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>;
};

export default ProductHeader;
