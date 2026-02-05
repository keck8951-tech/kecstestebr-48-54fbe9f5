import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Download, Filter, TrendingUp, DollarSign, ShoppingCart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Sale {
  id: string;
  attendant_name: string;
  payment_method: string;
  subtotal: number;
  discount: number;
  total: number;
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

const InternalSalesReport: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [attendants, setAttendants] = useState<string[]>([]);
  
  // Filters
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedAttendant, setSelectedAttendant] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('sales')
        .select(`
          *,
          client:clientes(empresa_nome),
          sale_items(product_name, quantity, unit_price, total)
        `)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }
      if (selectedAttendant) {
        query = query.eq('attendant_name', selectedAttendant);
      }
      if (selectedPayment) {
        query = query.eq('payment_method', selectedPayment);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSales(data || []);

      // Extract unique attendants
      const uniqueAttendants = [...new Set((data || []).map(s => s.attendant_name))];
      setAttendants(uniqueAttendants);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    fetchSales();
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedAttendant('');
    setSelectedPayment('');
    fetchSales();
  };

  // Calculate statistics
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalDiscount = sales.reduce((sum, sale) => sum + sale.discount, 0);
  const totalItems = sales.reduce((sum, sale) => sum + (sale.sale_items?.length || 0), 0);
  const averageTicket = sales.length > 0 ? totalSales / sales.length : 0;

  // Payment method breakdown
  const paymentBreakdown = sales.reduce((acc, sale) => {
    const method = sale.payment_method;
    if (!acc[method]) acc[method] = { count: 0, total: 0 };
    acc[method].count++;
    acc[method].total += sale.total;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  const exportToCSV = () => {
    const headers = ['Data', 'Cliente', 'Atendente', 'Pagamento', 'Subtotal', 'Desconto', 'Total'];
    const rows = sales.map(sale => [
      format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm'),
      sale.client?.empresa_nome || 'Consumidor Final',
      sale.attendant_name,
      PAYMENT_METHODS.find(m => m.value === sale.payment_method)?.label || sale.payment_method,
      sale.subtotal.toFixed(2),
      sale.discount.toFixed(2),
      sale.total.toFixed(2)
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-vendas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Atendente</Label>
              <Select value={selectedAttendant} onValueChange={setSelectedAttendant}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {attendants.map((attendant) => (
                    <SelectItem key={attendant} value={attendant}>
                      {attendant}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Pagamento</Label>
              <Select value={selectedPayment} onValueChange={setSelectedPayment}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters} disabled={loading}>
              <Filter className="h-4 w-4 mr-2" />
              Aplicar Filtros
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Limpar
            </Button>
            <Button variant="outline" onClick={exportToCSV} disabled={sales.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total em Vendas</p>
                <p className="text-2xl font-bold">R$ {totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quantidade de Vendas</p>
                <p className="text-2xl font-bold">{sales.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Descontos</p>
                <p className="text-2xl font-bold">R$ {totalDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Por Método de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(paymentBreakdown).map(([method, data]) => (
              <div key={method} className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  {PAYMENT_METHODS.find(m => m.value === method)?.label || method}
                </p>
                <p className="text-lg font-bold">R$ {data.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground">{data.count} venda(s)</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas ({sales.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Atendente</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    {format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>{sale.client?.empresa_nome || 'Consumidor Final'}</TableCell>
                  <TableCell>{sale.attendant_name}</TableCell>
                  <TableCell>
                    {PAYMENT_METHODS.find(m => m.value === sale.payment_method)?.label || sale.payment_method}
                  </TableCell>
                  <TableCell>{sale.sale_items?.length || 0}</TableCell>
                  <TableCell>
                    {sale.discount > 0 ? `R$ ${sale.discount.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell className="font-medium">
                    R$ {sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {sales.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma venda encontrada com os filtros aplicados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InternalSalesReport;
