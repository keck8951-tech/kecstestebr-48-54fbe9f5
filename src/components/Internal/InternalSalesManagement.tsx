import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, Search, ShoppingCart, Receipt, Printer, Eye, XCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useInternalAuth } from '@/contexts/InternalAuthContext';

interface Product {
  id: string;
  name: string;
  price_varejo: number;
  price_revenda: number;
  stock?: number;
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
  sale_items?: Array<{ id: string; product_id: string; product_name: string; quantity: number; unit_price: number; total: number }>;
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
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  
  // Form state for new sale
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

  // Edit form state
  const [editPaymentMethod, setEditPaymentMethod] = useState('');
  const [editDiscount, setEditDiscount] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [editClient, setEditClient] = useState('');

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
          sale_items(id, product_id, product_name, quantity, unit_price, total)
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
        .select('id, name, price_varejo, price_revenda, stock')
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

    const product = products.find(p => p.id === currentItem.product_id);
    if (product && product.stock !== undefined && product.stock < currentItem.quantity) {
      toast({
        title: "Estoque insuficiente",
        description: `Disponível: ${product.stock} unidade(s)`,
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
      toast({ title: "Erro", description: "Adicione pelo menos um produto à venda.", variant: "destructive" });
      return;
    }
    if (!paymentMethod) {
      toast({ title: "Erro", description: "Selecione o método de pagamento.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
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

      toast({ title: "Venda registrada!", description: `Venda de R$ ${calculateTotal().toFixed(2)} registrada com sucesso.` });

      setIsOpen(false);
      setSaleItems([]);
      setSelectedClient('');
      setPaymentMethod('');
      setDiscount(0);
      setNotes('');
      fetchSales();
      fetchProducts();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Ocorreu um erro ao registrar a venda.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSale = async (sale: Sale) => {
    if (sale.status === 'cancelled') {
      toast({ title: "Aviso", description: "Esta venda já está cancelada.", variant: "destructive" });
      return;
    }

    if (!confirm(`Deseja realmente cancelar esta venda de R$ ${sale.total.toFixed(2)}? O estoque será devolvido automaticamente.`)) {
      return;
    }

    setLoading(true);
    try {
      // Delete sale items first (triggers stock return via DB trigger)
      if (sale.sale_items && sale.sale_items.length > 0) {
        const { error: itemsError } = await supabase
          .from('sale_items')
          .delete()
          .eq('sale_id', sale.id);

        if (itemsError) throw itemsError;
      }

      // Update sale status to cancelled
      const { error: saleError } = await supabase
        .from('sales')
        .update({ status: 'cancelled', total: 0, subtotal: 0, discount: 0 })
        .eq('id', sale.id);

      if (saleError) throw saleError;

      toast({ title: "Venda cancelada", description: "A venda foi cancelada e o estoque foi devolvido." });
      fetchSales();
      fetchProducts();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Não foi possível cancelar a venda.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (sale: Sale) => {
    setEditingSale(sale);
    setEditPaymentMethod(sale.payment_method);
    setEditDiscount(sale.discount);
    setEditNotes(sale.notes || '');
    setEditClient(sale.client_id || '');
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSale) return;

    setLoading(true);
    try {
      const newTotal = editingSale.subtotal - editDiscount;

      const { error } = await supabase
        .from('sales')
        .update({
          payment_method: editPaymentMethod,
          discount: editDiscount,
          total: newTotal,
          notes: editNotes || null,
          client_id: editClient || null
        })
        .eq('id', editingSale.id);

      if (error) throw error;

      toast({ title: "Venda atualizada", description: "Os dados da venda foram atualizados com sucesso." });
      setIsEditOpen(false);
      setEditingSale(null);
      fetchSales();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Não foi possível atualizar a venda.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setIsReceiptOpen(true);
  };

  const printReceipt = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comprovante de Venda</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; max-width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .header h1 { font-size: 16px; margin: 0; }
            .info { margin-bottom: 15px; }
            .info p { margin: 2px 0; }
            .items { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; margin: 10px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .item-name { flex: 1; }
            .totals { margin-top: 10px; }
            .total-line { display: flex; justify-content: space-between; margin: 3px 0; }
            .total-final { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
            .cancelled { text-align: center; font-size: 18px; font-weight: bold; color: red; margin: 10px 0; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const filteredSales = sales.filter(sale =>
    sale.attendant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.client?.empresa_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.payment_method?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreate = hasPermission('sales.create');
  const canEdit = hasPermission('sales.edit');
  const canCancel = hasPermission('sales.cancel');

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
                    <Select value={selectedClient || 'none'} onValueChange={(v) => setSelectedClient(v === 'none' ? '' : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Consumidor Final</SelectItem>
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
                                <div className="flex items-center gap-2">
                                  <span>{product.name}</span>
                                  <Badge variant={product.stock && product.stock > 0 ? "secondary" : "destructive"} className="text-xs">
                                    {product.stock || 0} un
                                  </Badge>
                                  <span className="text-muted-foreground">R$ {product.price_varejo.toFixed(2)}</span>
                                </div>
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
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSales.map((sale) => (
            <TableRow key={sale.id} className={sale.status === 'cancelled' ? 'opacity-60' : ''}>
              <TableCell>
                {format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm')}
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
              <TableCell>
                <Badge variant={sale.status === 'cancelled' ? 'destructive' : 'default'}>
                  {sale.status === 'cancelled' ? 'Cancelada' : 'Concluída'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePrintReceipt(sale)}
                    title="Imprimir comprovante"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  {canEdit && sale.status !== 'cancelled' && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleOpenEdit(sale)}
                      title="Editar venda"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {canCancel && sale.status !== 'cancelled' && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCancelSale(sale)}
                      title="Cancelar venda"
                      className="text-destructive hover:text-destructive"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
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

      {/* Edit Sale Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Venda</DialogTitle>
            <DialogDescription>
              Altere os dados da venda. Os itens não podem ser modificados.
            </DialogDescription>
          </DialogHeader>
          
          {editingSale && (
            <div className="space-y-4 py-2">
              <div>
                <Label>Cliente</Label>
                <Select value={editClient || 'none'} onValueChange={(v) => setEditClient(v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Consumidor Final" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Consumidor Final</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.empresa_nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Método de Pagamento</Label>
                <Select value={editPaymentMethod} onValueChange={setEditPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
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

              <div>
                <Label>Desconto (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editDiscount}
                  onChange={(e) => setEditDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>R$ {editingSale.subtotal.toFixed(2)}</span>
                  </div>
                  {editDiscount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Desconto:</span>
                      <span>- R$ {editDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span>R$ {(editingSale.subtotal - editDiscount).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Comprovante de Venda</DialogTitle>
          </DialogHeader>
          
          {selectedSale && (
            <>
              <div ref={receiptRef} className="p-4 bg-white text-black">
                <div className="header">
                  <h1>COMPROVANTE DE VENDA</h1>
                  <p>KECS Informática</p>
                </div>

                {selectedSale.status === 'cancelled' && (
                  <div className="cancelled">*** CANCELADA ***</div>
                )}
                
                <div className="info">
                  <p><strong>Data:</strong> {format(new Date(selectedSale.created_at), 'dd/MM/yyyy HH:mm')}</p>
                  <p><strong>Cliente:</strong> {selectedSale.client?.empresa_nome || 'Consumidor Final'}</p>
                  <p><strong>Atendente:</strong> {selectedSale.attendant_name}</p>
                  <p><strong>Pagamento:</strong> {PAYMENT_METHODS.find(m => m.value === selectedSale.payment_method)?.label}</p>
                </div>

                <div className="items">
                  <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>ITENS:</p>
                  {selectedSale.sale_items?.map((item, index) => (
                    <div key={index} className="item">
                      <span className="item-name">{item.quantity}x {item.product_name}</span>
                      <span>R$ {item.total.toFixed(2)}</span>
                    </div>
                  ))}
                  {(!selectedSale.sale_items || selectedSale.sale_items.length === 0) && (
                    <p style={{ fontStyle: 'italic' }}>Nenhum item</p>
                  )}
                </div>

                <div className="totals">
                  <div className="total-line">
                    <span>Subtotal:</span>
                    <span>R$ {selectedSale.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedSale.discount > 0 && (
                    <div className="total-line">
                      <span>Desconto:</span>
                      <span>- R$ {selectedSale.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="total-line total-final">
                    <span>TOTAL:</span>
                    <span>R$ {selectedSale.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="footer">
                  <p>Obrigado pela preferência!</p>
                  <p>www.kecs.com.br</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={printReceipt} className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                <Button variant="outline" onClick={() => setIsReceiptOpen(false)}>
                  Fechar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InternalSalesManagement;
