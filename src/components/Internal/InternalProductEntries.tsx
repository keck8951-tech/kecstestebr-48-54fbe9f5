import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useInternalAuth } from '@/contexts/InternalAuthContext';

interface Product {
  id: string;
  name: string;
  sku?: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface EntryItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  cost_price: number;
  sale_price: number;
}

interface ProductEntry {
  id: string;
  product_id?: string;
  supplier_id?: string;
  quantity: number;
  cost_price: number;
  sale_price: number;
  entry_date: string;
  created_by?: string;
  product?: { name: string };
  supplier?: { name: string };
}

const InternalProductEntries: React.FC = () => {
  const [entries, setEntries] = useState<ProductEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state for batch entry
  const [entryItems, setEntryItems] = useState<EntryItem[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [currentItem, setCurrentItem] = useState({
    product_id: '',
    product_name: '',
    quantity: 1,
    cost_price: 0,
    sale_price: 0
  });

  const { toast } = useToast();
  const { user, hasPermission } = useInternalAuth();

  useEffect(() => {
    fetchEntries();
    fetchProducts();
    fetchSuppliers();
  }, []);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('product_entries')
        .select(`
          *,
          product:products(name),
          supplier:suppliers(name)
        `)
        .order('entry_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setCurrentItem(prev => ({
        ...prev,
        product_id: productId,
        product_name: product.name
      }));
    }
  };

  const addItemToList = () => {
    if (!currentItem.product_id || currentItem.quantity <= 0) {
      toast({
        title: "Erro",
        description: "Selecione um produto e informe a quantidade.",
        variant: "destructive",
      });
      return;
    }

    const newItem: EntryItem = {
      id: crypto.randomUUID(),
      product_id: currentItem.product_id,
      product_name: currentItem.product_name,
      quantity: currentItem.quantity,
      cost_price: currentItem.cost_price,
      sale_price: currentItem.sale_price
    };

    setEntryItems(prev => [...prev, newItem]);
    setCurrentItem({
      product_id: '',
      product_name: '',
      quantity: 1,
      cost_price: 0,
      sale_price: 0
    });
  };

  const removeItemFromList = (id: string) => {
    setEntryItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async () => {
    if (entryItems.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um produto à entrada.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const entriesToInsert = entryItems.map(item => ({
        product_id: item.product_id,
        supplier_id: selectedSupplier || null,
        quantity: item.quantity,
        cost_price: item.cost_price,
        sale_price: item.sale_price,
        created_by: user?.fullName || 'Sistema'
      }));

      const { error } = await supabase
        .from('product_entries')
        .insert(entriesToInsert);

      if (error) throw error;

      toast({
        title: "Entrada registrada!",
        description: `${entryItems.length} produto(s) registrado(s) com sucesso.`,
      });

      setIsOpen(false);
      setEntryItems([]);
      setSelectedSupplier('');
      fetchEntries();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao registrar a entrada.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter(entry =>
    entry.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.created_by?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreate = hasPermission('entries.create');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar entradas..."
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
                Nova Entrada
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Entrada de Produtos</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Supplier Selection */}
                <div>
                  <Label>Fornecedor (opcional)</Label>
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Add Item Form */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-5 gap-3">
                      <div className="col-span-2">
                        <Label>Produto</Label>
                        <Select value={currentItem.product_id} onValueChange={handleProductSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
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
                        <Label>Custo</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={currentItem.cost_price}
                          onChange={(e) => setCurrentItem(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <Label>Venda</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={currentItem.sale_price}
                          onChange={(e) => setCurrentItem(prev => ({ ...prev, sale_price: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      className="mt-3 w-full"
                      variant="outline"
                      onClick={addItemToList}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar à Lista
                    </Button>
                  </CardContent>
                </Card>

                {/* Items List */}
                {entryItems.length > 0 && (
                  <div>
                    <Label className="mb-2 block">Produtos na Entrada ({entryItems.length})</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Qtd</TableHead>
                          <TableHead>Custo</TableHead>
                          <TableHead>Venda</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entryItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>R$ {item.cost_price.toFixed(2)}</TableCell>
                            <TableCell>R$ {item.sale_price.toFixed(2)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItemFromList(item.id)}
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

                <div className="flex gap-2">
                  <Button onClick={handleSubmit} disabled={loading || entryItems.length === 0}>
                    {loading ? 'Registrando...' : 'Registrar Entrada'}
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

      {/* Entries History */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Qtd</TableHead>
            <TableHead>Custo</TableHead>
            <TableHead>Venda</TableHead>
            <TableHead>Registrado por</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEntries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>
                {new Date(entry.entry_date).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell className="font-medium">{entry.product?.name || '-'}</TableCell>
              <TableCell>{entry.supplier?.name || '-'}</TableCell>
              <TableCell>{entry.quantity}</TableCell>
              <TableCell>R$ {entry.cost_price.toFixed(2)}</TableCell>
              <TableCell>R$ {entry.sale_price.toFixed(2)}</TableCell>
              <TableCell>{entry.created_by || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {filteredEntries.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          {searchTerm ? `Nenhuma entrada encontrada para "${searchTerm}"` : 'Nenhuma entrada registrada'}
        </div>
      )}
    </div>
  );
};

export default InternalProductEntries;
