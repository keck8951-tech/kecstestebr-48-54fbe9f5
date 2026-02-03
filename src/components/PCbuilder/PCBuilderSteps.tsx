import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import PCComponentSelector from './PCComponentSelector';
import { SelectedComponent } from '@/types/pcbuilder';

const PC_STEPS = [
  { id: 'gabinete', name: 'Gabinete', category: 'gabinetes' },
  { id: 'processador', name: 'Processador', category: 'processadores' },
  { id: 'placa-mae', name: 'Placa Mãe', category: 'placas-mae' },
  { id: 'memoria-ram', name: 'Memória RAM', category: 'memorias' },
  { id: 'cooler', name: 'Cooler', category: 'coolers' },
  { id: 'fonte', name: 'Fonte', category: 'fontes' },
  { id: 'armazenamento', name: 'HD/SSD', category: 'armazenamento' },
  { id: 'mouse', name: 'Mouse', category: 'mouses' },
  { id: 'teclado', name: 'Teclado', category: 'teclados' },
  { id: 'monitor', name: 'Monitor', category: 'monitores' },
  { id: 'mousepad', name: 'Mouse Pad', category: 'mousepads' }
];
interface PCBuilderStepsProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  onComponentSelect: (component: SelectedComponent) => void;
  selectedComponents: SelectedComponent[];
}

const PCBuilderSteps = ({
  currentStep,
  onStepChange,
  onComponentSelect,
  selectedComponents
}: PCBuilderStepsProps) => {
  const currentStepData = PC_STEPS[currentStep];
  const isStepCompleted = (stepIndex: number) => {
    const step = PC_STEPS[stepIndex];
    return selectedComponents.some(c => c.category === step.category);
  };

  const handleNext = () => {
    if (currentStep < PC_STEPS.length - 1) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    onStepChange(stepIndex);
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progresso da Montagem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {PC_STEPS.map((step, index) => (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                  "border border-border hover:bg-muted",
                  index === currentStep && "bg-primary text-primary-foreground border-primary",
                  isStepCompleted(index) && index !== currentStep && "bg-green-100 text-green-800 border-green-300"
                )}
              >
                {isStepCompleted(index) && (
                  <Check className="w-4 h-4" />
                )}
                <span className="font-medium">{index + 1}</span>
                <span className="hidden sm:inline">{step.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                Passo {currentStep + 1}: {currentStepData.name}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Escolha o {currentStepData.name.toLowerCase()} para seu PC
              </p>
            </div>
            {isStepCompleted(currentStep) && (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="text-sm font-medium">Selecionado</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <PCComponentSelector
            category={currentStepData.category}
            onComponentSelect={(component) => {
              onComponentSelect({
                ...component,
                category: currentStepData.category
              });
            }}
            selectedComponent={selectedComponents.find(c => c.category === currentStepData.category)}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={currentStep === PC_STEPS.length - 1}
          className="flex items-center gap-2"
        >
          Próximo
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default PCBuilderSteps;
