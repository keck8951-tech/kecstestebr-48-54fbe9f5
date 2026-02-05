import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ImageUpload } from '@/components/ui/image-upload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useInternalAuth } from '@/contexts/InternalAuthContext';

interface Product {
  id: string;
  name: string;
  description?: string;
  cost_price?: number;
  price_varejo: number;
  price_revenda: number;
  image_url?: string;
  sku?: string;
  category_id?: string;
  is_active?: boolean;
  show_price_on_site?: boolean;
  stock?: number;
  category?: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

const InternalProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cost_price: '',
    price_varejo: '',
    price_revenda: '',
    image_url: '',
    sku: '',
    category_id: '',
    show_price_on_site: true
  });

  const { toast } = useToast();
  const { hasPermission } = useInternalAuth();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(term.toLowerCase()) ||
        product.sku?.toLowerCase().includes(term.toLowerCase()) ||
        product.category?.name.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      cost_price: '',
      price_varejo: '',
      price_revenda: '',
      image_url: '',
      sku: '',
      category_id: '',
      show_price_on_site: true
    });
    setEditingProduct(null);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      cost_price: product.cost_price?.toString() || '',
      price_varejo: product.price_varejo.toString(),
      price_revenda: product.price_revenda.toString(),
      image_url: product.image_url || '',
      sku: product.sku || '',
      category_id: product.category_id || '',
      show_price_on_site: product.show_price_on_site !== false
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description || null,
        cost_price: parseFloat(formData.cost_price) || 0,
        price_varejo: parseFloat(formData.price_varejo),
        price_revenda: parseFloat(formData.price_revenda),
        image_url: formData.image_url || null,
        sku: formData.sku || null,
        category_id: formData.category_id || null,
        show_price_on_site: formData.show_price_on_site
      };

      let error;
      if (editingProduct) {
        ({ error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id));
      } else {
        ({ error } = await supabase
          .from('products')
          .insert([productData]));
      }

      if (error) throw error;

      toast({
        title: editingProduct ? "Produto atualizado!" : "Produto cadastrado!",
        description: "Produto salvo com sucesso.",
      });

      fetchProducts();
      setIsOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar o produto.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: !currentStatus ? "Produto ativado!" : "Produto desativado!",
      });
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Produto excluído!",
      });

      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const canCreate = hasPermission('products.create');
  const canEdit = hasPermission('products.edit');
  const canDelete = hasPermission('products.delete');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {canCreate && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome do Produto *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="cost_price">Preço de Custo (R$)</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price_varejo">Preço Varejo (R$) *</Label>
                    <Input
                      id="price_varejo"
                      type="number"
                      step="0.01"
                      value={formData.price_varejo}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_varejo: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price_revenda">Preço Revenda (R$) *</Label>
                    <Input
                      id="price_revenda"
                      type="number"
                      step="0.01"
                      value={formData.price_revenda}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_revenda: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category_id">Categoria</Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                  bucket="product-images"
                  folder="products"
                />

                <div className="flex items-center space-x-2">
                  <Switch
                    id="show_price_on_site"
                    checked={formData.show_price_on_site}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_price_on_site: checked }))}
                  />
                  <Label htmlFor="show_price_on_site">Exibir preço no site</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Estoque</TableHead>
            <TableHead>Custo</TableHead>
            <TableHead>Varejo</TableHead>
            <TableHead>Revenda</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProducts.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.sku || '-'}</TableCell>
              <TableCell>{product.category?.name || '-'}</TableCell>
              <TableCell>
                <Badge variant={product.stock && product.stock > 0 ? "secondary" : "destructive"}>
                  {product.stock || 0}
                </Badge>
              </TableCell>
              <TableCell>R$ {(product.cost_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
              <TableCell>R$ {product.price_varejo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
              <TableCell>R$ {product.price_revenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
              <TableCell>
                <span className={`text-sm ${product.is_active !== false ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {product.is_active !== false ? 'Ativo' : 'Inativo'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {canEdit && (
                    <>
                      <Button
                        variant={product.is_active !== false ? "outline" : "default"}
                        size="icon"
                        onClick={() => handleToggleActive(product.id, product.is_active !== false)}
                        title={product.is_active !== false ? "Desativar" : "Ativar"}
                      >
                        {product.is_active !== false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {filteredProducts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? `Nenhum produto encontrado para "${searchTerm}"` : 'Nenhum produto cadastrado'}
        </div>
      )}
    </div>
  );
};

export default InternalProductManagement;
