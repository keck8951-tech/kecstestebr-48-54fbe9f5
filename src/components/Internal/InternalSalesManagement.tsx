import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, ShoppingCart, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useInternalAuth } from '@/contexts/InternalAuthContext';

interface Product {
  id: string;
  name: string;
  price_varejo: number;
  price_revenda: number;
}

interface Client {
  id: string;
  empresa_nome: string;
  contato?: string;
}

interface SaleItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Sale {
  id: string;
  client_id?: string;
  attendant_name: string;
  payment_method: string;
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
  status: string;
  created_at: string;
  client?: { empresa_nome: string };
  sale_items?: Array<{ product_name: string; quantity: number; unit_price: number; total: number }>;
}

const PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'transferencia', label: 'Transferência' },
];

const InternalSalesManagement: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [currentItem, setCurrentItem] = useState({
    product_id: '',
    product_name: '',
    quantity: 1,
    unit_price: 0
  });

  const { toast } = useToast();
  const { user, hasPermission } = useInternalAuth();

  useEffect(() => {
    fetchSales();
    fetchProducts();
    fetchClients();
  }, []);

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          client:clientes(empresa_nome),
          sale_items(product_name, quantity, unit_price, total)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price_varejo, price_revenda')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, empresa_nome, contato')
        .eq('is_active', true)
        .order('empresa_nome', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setCurrentItem(prev => ({
        ...prev,
        product_id: productId,
        product_name: product.name,
        unit_price: product.price_varejo
      }));
    }
  };

  const addItemToSale = () => {
    if (!currentItem.product_id || currentItem.quantity <= 0) {
      toast({
        title: "Erro",
        description: "Selecione um produto e informe a quantidade.",
        variant: "destructive",
      });
      return;
    }

    const newItem: SaleItem = {
      id: crypto.randomUUID(),
      product_id: currentItem.product_id,
      product_name: currentItem.product_name,
      quantity: currentItem.quantity,
      unit_price: currentItem.unit_price,
      total: currentItem.quantity * currentItem.unit_price
    };

    setSaleItems(prev => [...prev, newItem]);
    setCurrentItem({
      product_id: '',
      product_name: '',
      quantity: 1,
      unit_price: 0
    });
  };

  const removeItemFromSale = (id: string) => {
    setSaleItems(prev => prev.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return saleItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - discount;
  };

  const handleSubmit = async () => {
    if (saleItems.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um produto à venda.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Erro",
        description: "Selecione o método de pagamento.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          client_id: selectedClient || null,
          attendant_name: user?.fullName || 'Sistema',
          payment_method: paymentMethod,
          subtotal: calculateSubtotal(),
          discount: discount,
          total: calculateTotal(),
          notes: notes || null
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const itemsToInsert = saleItems.map(item => ({
        sale_id: saleData.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast({
        title: "Venda registrada!",
        description: `Venda de R$ ${calculateTotal().toFixed(2)} registrada com sucesso.`,
      });

      // Reset form
      setIsOpen(false);
      setSaleItems([]);
      setSelectedClient('');
      setPaymentMethod('');
      setDiscount(0);
      setNotes('');
      fetchSales();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao registrar a venda.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale =>
    sale.attendant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.client?.empresa_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.payment_method?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreate = hasPermission('sales.create');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar vendas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {canCreate && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Venda
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Venda</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Client and Payment */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cliente</Label>
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Consumidor Final</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.empresa_nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Método de Pagamento *</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Add Item Form */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-4 gap-3">
                      <div className="col-span-2">
                        <Label>Produto</Label>
                        <Select value={currentItem.product_id} onValueChange={handleProductSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - R$ {product.price_varejo.toFixed(2)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Qtd</Label>
                        <Input
                          type="number"
                          min="1"
                          value={currentItem.quantity}
                          onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                        />
                      </div>
                      <div>
                        <Label>Preço Unit.</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={currentItem.unit_price}
                          onChange={(e) => setCurrentItem(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      className="mt-3 w-full"
                      variant="outline"
                      onClick={addItemToSale}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Produto
                    </Button>
                  </CardContent>
                </Card>

                {/* Items List */}
                {saleItems.length > 0 && (
                  <div>
                    <Label className="mb-2 block">Produtos na Venda ({saleItems.length})</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Qtd</TableHead>
                          <TableHead>Preço Unit.</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {saleItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>R$ {item.unit_price.toFixed(2)}</TableCell>
                            <TableCell>R$ {item.total.toFixed(2)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItemFromSale(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Discount and Notes */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="discount">Desconto (R$)</Label>
                    <Input
                      id="discount"
                      type="number"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>

                {/* Totals */}
                {saleItems.length > 0 && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex justify-between text-lg">
                        <span>Subtotal:</span>
                        <span>R$ {calculateSubtotal().toFixed(2)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Desconto:</span>
                          <span>- R$ {discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xl font-bold border-t pt-2 mt-2">
                        <span>Total:</span>
                        <span>R$ {calculateTotal().toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleSubmit} disabled={loading || saleItems.length === 0}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {loading ? 'Finalizando...' : 'Finalizar Venda'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Sales History */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Atendente</TableHead>
            <TableHead>Pagamento</TableHead>
            <TableHead>Itens</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell>
                {new Date(sale.created_at).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell>{sale.client?.empresa_nome || 'Consumidor Final'}</TableCell>
              <TableCell>{sale.attendant_name}</TableCell>
              <TableCell>
                {PAYMENT_METHODS.find(m => m.value === sale.payment_method)?.label || sale.payment_method}
              </TableCell>
              <TableCell>{sale.sale_items?.length || 0}</TableCell>
              <TableCell className="font-medium">
                R$ {sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {filteredSales.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
          {searchTerm ? `Nenhuma venda encontrada para "${searchTerm}"` : 'Nenhuma venda registrada'}
        </div>
      )}
    </div>
  );
};

export default InternalSalesManagement;
