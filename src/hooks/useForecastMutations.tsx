import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/services/authService';
import { toast } from '@/hooks/use-toast';
import { config } from '@/config/env';

export const useForecastMutations = (productCodigo: string | undefined) => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ ano, tipo, id_tipo, mes, valor, metodo = 'USER' }: { 
      ano: number, 
      tipo: string, 
      id_tipo: number, 
      mes: string, 
      valor: number,
      metodo?: string
    }) => {
      if (!productCodigo) throw new Error('Product code not found');
      
      const currentUser = getCurrentUser();
      if (!currentUser) throw new Error('User not authenticated');
      
      console.log('Updating forecast with user data:', {
        user: currentUser,
        productCodigo,
        ano,
        id_tipo,
        mes,
        valor,
        metodo
      });

      const response = await fetch(`${config.API_URL}/forecast-values`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productCodigo,
          ano,
          id_tipo,
          mes,
          valor,
          metodo,
          userId: currentUser.id,
          username: currentUser.username,
          userFullName: currentUser.nome // Changed from name to nome to match User interface
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        toast({
          title: "Erro ao atualizar valor",
          description: `Falha ao salvar dados: ${errorText}`,
          variant: "destructive"
        });
        throw new Error(`Network response was not ok: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Update result:', result);
      toast({
        title: "Valor atualizado",
        description: "O valor foi salvo com sucesso",
        variant: "default"
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forecast_values'] });
    },
  });

  return {
    updateMutation,
  };
};
