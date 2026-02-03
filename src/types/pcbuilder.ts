export interface SelectedComponent {
  id: string;
  name: string;
  price_varejo: number;
  price_revenda: number;
  image_url?: string;
  category: string;
  description?: string;
}

export interface PcComponent {
  category: string;
  icon: React.ComponentType<any>;
  label: string;
  required: boolean;
  selectedProduct?: SelectedComponent;
}
