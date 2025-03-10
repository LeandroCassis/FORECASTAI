import React, { useState, useMemo, useEffect } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ForecastTableRow } from './ForecastTableRow';
import { useForecastData } from '@/hooks/useForecastData';
import { useForecastMutations } from '@/hooks/useForecastMutations';
import { useToast } from '@/components/ui/use-toast';

interface ForecastTableProps {
  produto: string;
}

const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const LoadingPlaceholder = () => (
  <div className="bg-white/80 backdrop-blur-lg rounded-b-2xl shadow-lg border border-t-0 border-blue-100/50 p-4 pt-0">
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
      <div className="space-y-3">
        <div className="h-8 bg-gray-200 rounded w-full"></div>
        <div className="h-8 bg-gray-200 rounded w-full"></div>
        <div className="h-8 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  </div>
);

const ForecastTable: React.FC<ForecastTableProps> = React.memo(({ produto }) => {
  const [localValues, setLocalValues] = useState<{ [key: string]: { [key: string]: number } }>({});
  const { productData, grupos, monthConfigurations, forecastValues, hasErrors } = useForecastData(produto);
  const { updateMutation } = useForecastMutations(productData?.codigo);
  const { toast } = useToast();

  useEffect(() => {
    if (hasErrors) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load forecast data. Please try again later.",
      });
    }
  }, [hasErrors, toast]);

  const handleValueChange = (ano: number, tipo: string, id_tipo: number, month: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    const key = `${ano}-${id_tipo}`;
    
    setLocalValues(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [month]: numericValue
      }
    }));
  };

  const handleBlur = (ano: number, tipo: string, id_tipo: number, month: string) => {
    const key = `${ano}-${id_tipo}`;
    const value = localValues[key]?.[month];
    
    if (value !== undefined) {
      updateMutation.mutate({ ano, tipo, id_tipo, mes: month, valor: value });
    }
  };

  const handleTotalChange = useMemo(() => (ano: number, tipo: string, id_tipo: number, totalValue: string) => {
    const numericTotal = parseInt(totalValue) || 0;
    const yearConfig = monthConfigurations?.[ano] || {};
    
    if (!yearConfig) return;

    const key = `${ano}-${id_tipo}`;
    const realizedMonthsTotal = months.reduce((sum, month) => {
      if (yearConfig[month]?.realizado && forecastValues?.[key]?.[month]) {
        return sum + (forecastValues[key][month] || 0);
      }
      return sum;
    }, 0);

    const remainingTotal = numericTotal - realizedMonthsTotal;
    const openMonthsPercentageSum = Object.values(yearConfig)
      .reduce((sum, config) => !config.realizado ? sum + config.pct_atual : sum, 0);

    months.forEach(month => {
      const monthConfig = yearConfig[month];
      if (monthConfig && !monthConfig.realizado) {
        const adjustedPercentage = monthConfig.pct_atual / openMonthsPercentageSum;
        const newValue = Number((remainingTotal * adjustedPercentage).toFixed(1));
        
        setLocalValues(prev => ({
          ...prev,
          [key]: {
            ...(prev[key] || {}),
            [month]: newValue
          }
        }));
        
        updateMutation.mutate({ ano, tipo, id_tipo, mes: month, valor: newValue });
      }
    });
  }, [monthConfigurations, forecastValues, updateMutation]);

  const getValue = useMemo(() => (ano: number, id_tipo: number, month: string) => {
    const key = `${ano}-${id_tipo}`;
    return localValues[key]?.[month] ?? forecastValues?.[key]?.[month] ?? 0;
  }, [localValues, forecastValues]);

  const calculateTotal = useMemo(() => (ano: number, id_tipo: number) => {
    return Math.round(months.reduce((sum, month) => {
      return sum + (getValue(ano, id_tipo, month) || 0);
    }, 0));
  }, [getValue]);

  if (hasErrors) {
    return <LoadingPlaceholder />;
  }

  if (!grupos || !monthConfigurations) {
    return <LoadingPlaceholder />;
  }

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-b-2xl shadow-lg border border-t-0 border-blue-100/50 p-4 pt-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-green-700 to-blue-700 hover:from-blue-600 hover:to-blue-700">
              <TableHead className="text-white font-medium w-[100px] min-w-[100px] text-left py-2 text-[1.15rem] border-r border-blue-500/30">ANO</TableHead>
              <TableHead className="text-white font-medium w-[120px] min-w-[120px] text-left py-2 text-[1.15rem] border-r border-blue-500/30">TIPO</TableHead>
              {months.map(month => (
                <TableHead 
                  key={month} 
                  className="text-white font-medium w-[100px] min-w-[100px] text-right py-2 text-[1.15rem] border-r border-blue-500/30"
                >
                  {month}
                </TableHead>
              ))}
              <TableHead className="text-white font-medium w-[120px] min-w-[120px] text-right py-2 text-[1.15rem]">TOTAL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grupos.map((grupo) => (
              <ForecastTableRow
                key={`${grupo.ano}-${grupo.id_tipo}`}
                ano={grupo.ano}
                tipo={grupo.tipo}
                id_tipo={grupo.id_tipo}
                yearConfig={monthConfigurations[grupo.ano] || {}}
                getValue={getValue}
                handleValueChange={handleValueChange}
                handleBlur={handleBlur}
                handleTotalChange={handleTotalChange}
                calculateTotal={calculateTotal}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

ForecastTable.displayName = 'ForecastTable';

export default ForecastTable;
