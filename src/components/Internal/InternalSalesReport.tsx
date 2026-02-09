import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subMonths, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Download, Filter, TrendingUp, DollarSign, ShoppingCart, BarChart3, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SaleItemWithCost {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Sale {
  id: string;
  attendant_name: string;
  payment_method: string;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  created_at: string;
  client?: { empresa_nome: string };
  sale_items?: SaleItemWithCost[];
}

interface ProductCostMap {
  [productId: string]: number;
}

const PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'transferencia', label: 'Transferência' },
];

const PERIOD_PRESETS = [
  { value: 'today', label: 'Hoje' },
  { value: '7days', label: 'Últimos 7 dias' },
  { value: '30days', label: 'Últimos 30 dias' },
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_month', label: 'Mês passado' },
  { value: 'this_year', label: 'Este ano' },
  { value: 'custom', label: 'Personalizado' },
];

const InternalSalesReport: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [productCosts, setProductCosts] = useState<ProductCostMap>({});
  const [loading, setLoading] = useState(false);
  const [attendants, setAttendants] = useState<string[]>([]);
  
  // Filters
  const [periodPreset, setPeriodPreset] = useState('30days');
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [selectedAttendant, setSelectedAttendant] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [reportView, setReportView] = useState('overview');

  useEffect(() => {
    fetchProductCosts();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [startDate, endDate, selectedAttendant, selectedPayment]);

  const handlePeriodChange = (preset: string) => {
    setPeriodPreset(preset);
    const now = new Date();
    
    switch (preset) {
      case 'today':
        setStartDate(startOfDay(now));
        setEndDate(endOfDay(now));
        break;
      case '7days':
        setStartDate(subDays(now, 7));
        setEndDate(now);
        break;
      case '30days':
        setStartDate(subDays(now, 30));
        setEndDate(now);
        break;
      case 'this_month':
        setStartDate(startOfMonth(now));
        setEndDate(endOfMonth(now));
        break;
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        setStartDate(startOfMonth(lastMonth));
        setEndDate(endOfMonth(lastMonth));
        break;
      case 'this_year':
        setStartDate(startOfYear(now));
        setEndDate(endOfYear(now));
        break;
      case 'custom':
        break;
    }
  };

  const fetchProductCosts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, cost_price');

      if (error) throw error;
      
      const costMap: ProductCostMap = {};
      (data || []).forEach(p => {
        costMap[p.id] = p.cost_price || 0;
      });
      setProductCosts(costMap);
    } catch (error) {
      console.error('Error fetching product costs:', error);
    }
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('sales')
        .select(`
          *,
          client:clientes(empresa_nome),
          sale_items(product_id, product_name, quantity, unit_price, total)
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        const endOfDayDate = endOfDay(endDate);
        query = query.lte('created_at', endOfDayDate.toISOString());
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

      const uniqueAttendants = [...new Set((data || []).map(s => s.attendant_name))];
      setAttendants(uniqueAttendants);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate profit for a sale
  const calculateSaleProfit = (sale: Sale): number => {
    if (!sale.sale_items) return 0;
    const totalCost = sale.sale_items.reduce((sum, item) => {
      const costPrice = productCosts[item.product_id] || 0;
      return sum + (costPrice * item.quantity);
    }, 0);
    return sale.total - totalCost;
  };

  // Statistics
  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalDiscount = sales.reduce((sum, sale) => sum + sale.discount, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + calculateSaleProfit(sale), 0);
    const totalCost = totalRevenue - totalProfit;
    const averageTicket = sales.length > 0 ? totalRevenue / sales.length : 0;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalDiscount, totalProfit, totalCost, averageTicket, profitMargin };
  }, [sales, productCosts]);

  // Payment method breakdown
  const paymentBreakdown = useMemo(() => {
    return sales.reduce((acc, sale) => {
      const method = sale.payment_method;
      if (!acc[method]) acc[method] = { count: 0, total: 0 };
      acc[method].count++;
      acc[method].total += sale.total;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);
  }, [sales]);

  // Daily breakdown
  const dailyBreakdown = useMemo(() => {
    if (!startDate || !endDate) return [];
    
    const salesByDay: Record<string, { revenue: number; profit: number; count: number }> = {};
    
    sales.forEach(sale => {
      const saleDate = new Date(sale.created_at);
      const day = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}-${String(saleDate.getDate()).padStart(2, '0')}`;
      if (!salesByDay[day]) salesByDay[day] = { revenue: 0, profit: 0, count: 0 };
      salesByDay[day].revenue += sale.total;
      salesByDay[day].profit += calculateSaleProfit(sale);
      salesByDay[day].count++;
    });

    return Object.entries(salesByDay)
      .map(([date, data]) => {
        const [year, month, dayNum] = date.split('-').map(Number);
        const localDate = new Date(year, month - 1, dayNum);
        return {
          date,
          formattedDate: format(localDate, 'dd/MM/yyyy'),
          ...data
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sales, productCosts, startDate, endDate]);

  // Monthly breakdown
  const monthlyBreakdown = useMemo(() => {
    const salesByMonth: Record<string, { revenue: number; profit: number; count: number }> = {};
    
    sales.forEach(sale => {
      const saleDate = new Date(sale.created_at);
      const month = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
      if (!salesByMonth[month]) salesByMonth[month] = { revenue: 0, profit: 0, count: 0 };
      salesByMonth[month].revenue += sale.total;
      salesByMonth[month].profit += calculateSaleProfit(sale);
      salesByMonth[month].count++;
    });

    return Object.entries(salesByMonth)
      .map(([month, data]) => {
        const [year, monthNum] = month.split('-').map(Number);
        const localDate = new Date(year, monthNum - 1, 1);
        return {
          month,
          formattedMonth: format(localDate, 'MMMM yyyy', { locale: ptBR }),
          ...data
        };
      })
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [sales, productCosts]);

  const clearFilters = () => {
    setPeriodPreset('30days');
    setStartDate(subDays(new Date(), 30));
    setEndDate(new Date());
    setSelectedAttendant('');
    setSelectedPayment('');
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Cliente', 'Atendente', 'Pagamento', 'Subtotal', 'Desconto', 'Total', 'Lucro'];
    const rows = sales.map(sale => [
      format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm'),
      sale.client?.empresa_nome || 'Consumidor Final',
      sale.attendant_name,
      PAYMENT_METHODS.find(m => m.value === sale.payment_method)?.label || sale.payment_method,
      sale.subtotal.toFixed(2),
      sale.discount.toFixed(2),
      sale.total.toFixed(2),
      calculateSaleProfit(sale).toFixed(2)
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Período</Label>
              <Select value={periodPreset} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {periodPreset === 'custom' && (
              <>
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
              </>
            )}

            <div>
              <Label>Atendente</Label>
              <Select value={selectedAttendant || 'all'} onValueChange={(v) => setSelectedAttendant(v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
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
              <Select value={selectedPayment || 'all'} onValueChange={(v) => setSelectedPayment(v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
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
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
            <Button variant="outline" onClick={exportToCSV} disabled={sales.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold">R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lucro Total</p>
                <p className="text-2xl font-bold text-green-600">R$ {stats.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Margem de Lucro</p>
                <p className="text-2xl font-bold">{stats.profitMargin.toFixed(1)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendas</p>
                <p className="text-2xl font-bold">{sales.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">R$ {stats.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <Wallet className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs value={reportView} onValueChange={setReportView}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="daily">Por Dia</TabsTrigger>
          <TabsTrigger value="monthly">Por Mês</TabsTrigger>
          <TabsTrigger value="sales">Todas as Vendas</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Por Método de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(paymentBreakdown).map(([method, data]) => (
                    <div key={method} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">
                          {PAYMENT_METHODS.find(m => m.value === method)?.label || method}
                        </p>
                        <p className="text-xs text-muted-foreground">{data.count} venda(s)</p>
                      </div>
                      <p className="font-bold">R$ {data.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  ))}
                  {Object.keys(paymentBreakdown).length === 0 && (
                    <p className="text-center text-muted-foreground py-4">Nenhum dado disponível</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Profit Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span>Receita Bruta</span>
                    <span className="font-bold">R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span>Custo dos Produtos</span>
                    <span className="font-bold text-destructive">- R$ {stats.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span>Descontos</span>
                    <span className="font-bold text-destructive">- R$ {stats.totalDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <span className="font-bold">Lucro Líquido</span>
                    <span className="font-bold text-green-600">R$ {stats.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Daily Tab */}
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Vendas por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Receita</TableHead>
                    <TableHead>Lucro</TableHead>
                    <TableHead>Margem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyBreakdown.map((day) => {
                    const margin = day.revenue > 0 ? (day.profit / day.revenue) * 100 : 0;
                    return (
                      <TableRow key={day.date}>
                        <TableCell className="font-medium">{day.formattedDate}</TableCell>
                        <TableCell>{day.count}</TableCell>
                        <TableCell>R$ {day.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className={day.profit >= 0 ? 'text-green-600' : 'text-destructive'}>
                          R$ {day.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{margin.toFixed(1)}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {dailyBreakdown.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma venda no período selecionado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Tab */}
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Vendas por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Receita</TableHead>
                    <TableHead>Lucro</TableHead>
                    <TableHead>Margem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyBreakdown.map((month) => {
                    const margin = month.revenue > 0 ? (month.profit / month.revenue) * 100 : 0;
                    return (
                      <TableRow key={month.month}>
                        <TableCell className="font-medium capitalize">{month.formattedMonth}</TableCell>
                        <TableCell>{month.count}</TableCell>
                        <TableCell>R$ {month.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className={month.profit >= 0 ? 'text-green-600' : 'text-destructive'}>
                          R$ {month.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{margin.toFixed(1)}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {monthlyBreakdown.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma venda no período selecionado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Sales Tab */}
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Vendas ({sales.length})</CardTitle>
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
                    <TableHead>Total</TableHead>
                    <TableHead>Lucro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => {
                    const profit = calculateSaleProfit(sale);
                    return (
                      <TableRow key={sale.id}>
                        <TableCell>{format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                        <TableCell>{sale.client?.empresa_nome || 'Consumidor Final'}</TableCell>
                        <TableCell>{sale.attendant_name}</TableCell>
                        <TableCell>
                          {PAYMENT_METHODS.find(m => m.value === sale.payment_method)?.label || sale.payment_method}
                        </TableCell>
                        <TableCell>{sale.sale_items?.length || 0}</TableCell>
                        <TableCell className="font-medium">
                          R$ {sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className={profit >= 0 ? 'text-green-600 font-medium' : 'text-destructive font-medium'}>
                          R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {sales.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma venda encontrada com os filtros aplicados
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InternalSalesReport;
