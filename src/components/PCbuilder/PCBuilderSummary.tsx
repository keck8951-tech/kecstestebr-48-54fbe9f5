import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SelectedComponent } from '@/types/pcbuilder';

const STEP_NAMES: { [key: string]: string } = {
  'gabinetes': 'Gabinete',
  'processadores': 'Processador',
  'placas-mae': 'Placa Mãe',
  'memorias': 'Memória RAM',
  'coolers': 'Cooler',
  'fontes': 'Fonte',
  'armazenamento': 'HD/SSD',
  'mouses': 'Mouse',
  'teclados': 'Teclado',
  'monitores': 'Monitor',
  'mousepads': 'Mouse Pad'
};

const STEP_INDICES: { [key: string]: number } = {
  'gabinetes': 0,
  'processadores': 1,
  'placas-mae': 2,
  'memorias': 3,
  'coolers': 4,
  'fontes': 5,
  'armazenamento': 6,
  'mouses': 7,
  'teclados': 8,
  'monitores': 9,
  'mousepads': 10
};

interface PCBuilderSummaryProps {
  selectedComponents: SelectedComponent[];
  onComponentRemove: (category: string) => void;
  onStepChange: (step: number) => void;
}

const PCBuilderSummary = ({
  selectedComponents,
  onComponentRemove,
  onStepChange
}: PCBuilderSummaryProps) => {
  const { profile } = useAuth();

  const getPrice = (component: SelectedComponent) => {
    return profile?.setor === 'revenda' ? component.price_revenda : component.price_varejo;
  };

  const getTotalPrice = () => {
    return selectedComponents.reduce((total, component) => {
      return total + getPrice(component);
    }, 0);
  };

  const handleWhatsAppContact = () => {
    if (selectedComponents.length === 0) return;

    const total = getTotalPrice();
    let message = `🖥️ *ORÇAMENTO - MONTAGEM DE PC*\n\n`;
    
    selectedComponents.forEach((component, index) => {
      const price = getPrice(component);
      const stepName = STEP_NAMES[component.category] || component.category;
      message += `${index + 1}. *${stepName}*\n`;
      message += `   ${component.name}\n`;
      message += `   R$ ${price.toFixed(2)}\n\n`;
    });

    message += `💰 *TOTAL: R$ ${total.toFixed(2)}*\n\n`;
    message += `Gostaria de mais informações sobre esta configuração!`;

    const whatsappUrl = `https://wa.me/5585989040000?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEditComponent = (category: string) => {
    const stepIndex = STEP_INDICES[category];
    if (stepIndex !== undefined) {
      onStepChange(stepIndex);
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Resumo da Configuração</span>
          <Badge variant="secondary">
            {selectedComponents.length} itens
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedComponents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum componente selecionado</p>
            <p className="text-sm mt-1">
              Comece escolhendo os componentes para seu PC
            </p>
          </div>
        ) : (
          <>
            {/* Components List */}
            <div className="space-y-3">
              {selectedComponents.map((component) => {
                const price = getPrice(component);
                const stepName = STEP_NAMES[component.category] || component.category;

                return (
                  <div key={component.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    {/* Component Image */}
                    <div className="w-12 h-12 bg-background rounded overflow-hidden flex-shrink-0">
                      {component.image_url ? (
                        <img
                          src={component.image_url}
                          alt={component.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          Sem foto
                        </div>
                      )}
                    </div>

                    {/* Component Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">
                        {stepName}
                      </p>
                      <p className="text-sm font-medium line-clamp-2">
                        {component.name}
                      </p>
                      <p className="text-sm font-bold text-primary">
                        R$ {price.toFixed(2)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditComponent(component.category)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onComponentRemove(component.category)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />

            {/* Total */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="text-xl font-bold text-primary">
                  R$ {getTotalPrice().toFixed(2)}
                </span>
              </div>

              {/* Contact Button */}
              <Button
                onClick={handleWhatsAppContact}
                className="w-full"
                size="lg"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Solicitar Orçamento
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {profile?.setor === 'revenda' 
                  ? 'Preços de revenda aplicados' 
                  : 'Preços de varejo aplicados'}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PCBuilderSummary;
