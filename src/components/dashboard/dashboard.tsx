

"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Product, UrlInfo } from '@/types';
import { AlertCircle, Download, TrendingUp, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FiltersGroup } from './filters-group';
import { ProductAccordion } from './product-accordion';
import { ComparativeAnalysis } from './comparative-analysis';
import { OverallPriceAnalysis } from './overall-price-analysis';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriceComparisonTable } from './price-comparison-table';
import { SellerComparisonTable } from './seller-comparison-table';
import { Toaster } from '@/components/ui/toaster';
import { isValidHttpUrl, isValidImageUrl } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader } from '../ui/card';
import { UrlManagementTable } from './url-management-table';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { BuyboxCompetitionAnalysis } from './buybox-competition-analysis';


// Helper to adapt the new API response to the existing Product type
function adaptApiData(apiProduct: any): Product {
    const imageUrl = apiProduct.imagem?.startsWith('//')
    ? `https:${apiProduct.imagem}`
    : apiProduct.imagem;

  return {
    id: apiProduct.sku,
    ean: apiProduct.ean,
    name: apiProduct.descricao,
    brand: apiProduct.marca,
    marketplace: apiProduct.marketplace,
    seller: apiProduct.loja,
    key_loja: apiProduct.key_loja,
    price: parseFloat(apiProduct.preco_final),
    url: isValidHttpUrl(apiProduct.url) ? apiProduct.url : null,
    image: imageUrl,
    updated_at: apiProduct.data_hora,
    status: apiProduct.status,
    change_price: apiProduct.change_price,
    is_active: true, // Default value, will be updated
    ean_key: `${apiProduct.ean}-${apiProduct.marketplace}`, // Default value, will be updated
  };
}

export type Filters = {
  ean: string[];
  marketplace: string[];
  seller: string[];
  description: string[];
  brand: string[];
  status: string[];
};


function DashboardContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [urls, setUrls] = useState<UrlInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonMarketplace, setComparisonMarketplace] = useState<string>("");
  const [showOnlyWithCompetitors, setShowOnlyWithCompetitors] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    ean: [],
    marketplace: [],
    seller: [],
    description: [],
    brand: [],
    status: [],
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const [productsResponse, urlsResponse] = await Promise.all([
            fetch('/api/price-data', { cache: 'no-store' }),
            fetch('/api/url-data', { cache: 'no-store' }),
        ]);

        if (!productsResponse.ok) {
          throw new Error(`Erro ao conectar com a API de produtos. Status: ${productsResponse.status} ${productsResponse.statusText}`);
        }
        if (!urlsResponse.ok) {
            throw new Error(`Erro ao conectar com a API de URLs. Status: ${urlsResponse.status} ${urlsResponse.statusText}`);
        }

        const productsData = await productsResponse.json();
        const urlsData = await urlsResponse.json();
        
        const results = productsData.results || productsData;
        
        if (!Array.isArray(results)) {
            throw new Error("O formato dos dados de produtos recebidos da API não é o esperado.");
        }
        
        const urlMap = new Map<string, UrlInfo>();
        if (Array.isArray(urlsData)) {
            const processedUrls = urlsData.map(item => ({
                ...item,
                is_active: item.is_active !== undefined ? item.is_active : true,
                ean_key: item.ean_key || `${item.ean}-${item.marketplace}`
            }));
            setUrls(processedUrls);

            for (const item of processedUrls) {
                if(item.ean && item.marketplace) {
                    const key = `${item.ean}-${item.marketplace}`;
                    urlMap.set(key, item);
                }
            }
        }

        const adaptedProducts = results.map(adaptApiData).filter(p => p.status === 'ativo');
        
        const mergedProducts = adaptedProducts.map(product => {
            const sameEanProducts = adaptedProducts.filter(p => p.ean === product.ean && isValidImageUrl(p.image));
            const imageProduct = sameEanProducts.find(p => p.marketplace === "Época Cosméticos") || sameEanProducts[0];
            
            const finalProduct = { ...product };

            if (!isValidImageUrl(finalProduct.image) && imageProduct) {
                finalProduct.image = imageProduct.image;
            }

            const urlInfo = urlMap.get(finalProduct.ean_key);
            if (urlInfo) {
                finalProduct.url = isValidHttpUrl(urlInfo.url) ? urlInfo.url : finalProduct.url;
                finalProduct.is_active = urlInfo.is_active;
                finalProduct.ean_key = urlInfo.ean_key;
            }

            return finalProduct;
        });

        setProducts(mergedProducts);

      } catch (e) {
        if (e instanceof Error) {
          setError(`Falha ao buscar os dados: ${e.message}. Verifique sua conexão ou a URL da API.`);
        } else {
          setError('Ocorreu um erro desconhecido ao processar os dados.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const uniqueEans = useMemo(() => [...Array.from(new Set(products.map(p => p.ean).filter(Boolean).sort()))], [products]);
  const uniqueMarketplaces = useMemo(() => [...Array.from(new Set(products.map(p => p.marketplace).filter(Boolean).sort()))], [products]);
  const uniqueSellers = useMemo(() => [...Array.from(new Set(products.map(p => p.seller).filter(Boolean).sort()))], [products]);
  const uniqueDescriptions = useMemo(() => [...Array.from(new Set(products.map(p => p.name).filter(Boolean).sort()))], [products]);
  const uniqueBrands = useMemo(() => [...Array.from(new Set(products.map(p => p.brand).filter(Boolean).sort()))], [products]);
  const uniqueStatuses = useMemo(() => [...Array.from(new Set(products.map(p => p.status).filter(Boolean).sort()))], [products]);

  // Set default comparison marketplace once data is loaded
  useEffect(() => {
      if(uniqueMarketplaces.length > 0 && !comparisonMarketplace) {
          const epoca = uniqueMarketplaces.find(m => m.toLowerCase().includes('época'));
          setComparisonMarketplace(epoca || uniqueMarketplaces[0]);
      }
  }, [uniqueMarketplaces, comparisonMarketplace]);

  const filteredProducts = useMemo(() => {
    let productsToFilter = products;

    if (showOnlyWithCompetitors) {
        const eanMarketplaceCount = products.reduce((acc, p) => {
            if (p.ean) {
                if (!acc[p.ean]) {
                    acc[p.ean] = new Set();
                }
                acc[p.ean].add(p.marketplace);
            }
            return acc;
        }, {} as Record<string, Set<string>>);

        const eansWithCompetitors = Object.keys(eanMarketplaceCount).filter(ean => eanMarketplaceCount[ean].size > 1);
        productsToFilter = products.filter(p => p.ean && eansWithCompetitors.includes(p.ean));
    }


    return productsToFilter.filter(p => {
        const eanMatch = filters.ean.length === 0 || (p.ean && filters.ean.includes(p.ean));
        const marketplaceMatch = filters.marketplace.length === 0 || (p.marketplace && filters.marketplace.includes(p.marketplace));
        const sellerMatch = filters.seller.length === 0 || (p.seller && filters.seller.includes(p.seller));
        const descriptionMatch = filters.description.length === 0 || filters.description.includes(p.name);
        const brandMatch = filters.brand.length === 0 || (p.brand && filters.brand.includes(p.brand));
        const statusMatch = filters.status.length === 0 || (p.status && filters.status.includes(p.status));

        return eanMatch && marketplaceMatch && sellerMatch && descriptionMatch && brandMatch && statusMatch;
    });
  }, [products, filters, showOnlyWithCompetitors]);

  const handleFilterChange = (filterName: keyof Filters, value: string) => {
    setFilters(prev => {
      const currentValues = prev[filterName];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        [filterName]: newValues,
      };
    });
  };

  const clearFilters = () => {
    setFilters({
        ean: [],
        marketplace: [],
        seller: [],
        description: [],
        brand: [],
        status: [],
    });
    setShowOnlyWithCompetitors(false);
  };

  const updateProductStatus = (eanKey: string, newStatus: boolean) => {
      setProducts(prevProducts => 
          prevProducts.map(p => 
              p.ean_key === eanKey ? { ...p, is_active: newStatus } : p
          )
      );
      setUrls(prevUrls =>
        prevUrls.map(u =>
            u.ean_key === eanKey ? { ...u, is_active: newStatus } : u
        )
      );
  };
    
  const handleExport = () => {
    const dataToExport = filteredProducts.map(p => ({
        EAN: p.ean,
        Descrição: p.name,
        Marca: p.brand || '',
        Marketplace: p.marketplace,
        Vendedor: p.seller,
        Preço: p.price,
        URL: p.url || '',
        Status: p.status || '',
        Ativo: p.is_active ? 'Sim' : 'Não'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos");

    const date = new Date().toISOString().slice(0,10);
    XLSX.writeFile(workbook, `produtos_exportados_${date}.xlsx`);
  };


  return (
    <div className="flex h-screen flex-col bg-background">
        <Toaster />

        {/* Header */}
        <header className="shrink-0 bg-slate-900 text-white shadow-lg z-10">
            <div className="px-4 md:px-8 h-16 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                        <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-base font-bold leading-tight tracking-tight">PriceTrack</p>
                        <p className="text-xs text-slate-400 leading-tight">Inteligência de preços em tempo real</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-300">
                    {!loading && (
                        <span className="hidden md:flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            {products.length} produtos carregados
                        </span>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-xs font-medium"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Atualizar</span>
                    </button>
                </div>
            </div>
        </header>

        <div className="flex-1 flex flex-col overflow-auto">
            <Tabs defaultValue="overview" className="w-full flex flex-col flex-1">
                {/* Tab nav */}
                <div className="sticky top-0 z-10 shrink-0 bg-white border-b shadow-sm px-4 md:px-8">
                    <TabsList className="h-auto bg-transparent gap-0 p-0 flex-wrap">
                        {[
                            { value: 'overview',  label: 'Visão Geral' },
                            { value: 'granular',  label: 'Por Marketplace' },
                            { value: 'buybox',    label: 'Buybox' },
                            { value: 'seller',    label: 'Por Vendedor' },
                            { value: 'geral',     label: 'Análise Geral' },
                            { value: 'urls',      label: 'Gerenciar URLs' },
                        ].map(tab => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>
                <TabsContent value="overview" className="mt-0 p-4 md:p-6 overflow-y-auto">
                    <div className="space-y-6">
                        <Card className="p-4">
                             <div className="flex flex-col md:flex-row items-center gap-4">
                                <h2 className="text-lg font-bold tracking-tight">Análise Comparativa</h2>
                                <div className="w-full md:w-64">
                                <Select value={comparisonMarketplace} onValueChange={setComparisonMarketplace} disabled={loading}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um Marketplace" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {uniqueMarketplaces.map(mp => (
                                            <SelectItem key={mp} value={mp}>{mp}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                </div>
                            </div>
                        </Card>
                        <ComparativeAnalysis filteredProducts={filteredProducts} loading={loading} selectedMarketplace={comparisonMarketplace} />
                        
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                     <h2 className="text-lg font-semibold">Filtros de Produtos</h2>
                                      <div className="flex items-center space-x-2">
                                        <Switch
                                            id="competitors-only"
                                            checked={showOnlyWithCompetitors}
                                            onCheckedChange={setShowOnlyWithCompetitors}
                                            disabled={loading}
                                        />
                                        <Label htmlFor="competitors-only" className="text-sm">Mostrar apenas produtos com concorrentes</Label>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <FiltersGroup
                                    eans={uniqueEans}
                                    marketplaces={uniqueMarketplaces}
                                    sellers={uniqueSellers}
                                    descriptions={uniqueDescriptions}
                                    brands={uniqueBrands}
                                    statuses={uniqueStatuses}
                                    filters={filters}
                                    onFilterChange={handleFilterChange}
                                    onClearFilters={clearFilters}
                                    onExport={handleExport}
                                    loading={loading}
                                />
                            </CardContent>
                        </Card>

                        <div>
                            {error ? (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Erro de Comunicação</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            ) : (
                                <ProductAccordion products={filteredProducts} loading={loading} />
                            )}
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="granular" className="mt-0 p-4 md:p-6 flex flex-col">
                    <PriceComparisonTable allProducts={filteredProducts} loading={loading} />
                </TabsContent>
                <TabsContent value="buybox" className="mt-0 p-4 md:p-6 flex flex-col">
                    <BuyboxCompetitionAnalysis allProducts={products} loading={loading} />
                </TabsContent>
                <TabsContent value="seller" className="mt-0 p-4 md:p-6 flex flex-col">
                    <SellerComparisonTable allProducts={filteredProducts} loading={loading} />
                </TabsContent>
                <TabsContent value="geral" className="mt-0 p-4 md:p-6">
                    <OverallPriceAnalysis allProducts={filteredProducts} loading={loading} />
                </TabsContent>
                <TabsContent value="urls" className="mt-0 p-4 md:p-6 flex flex-col">
                    <UrlManagementTable urls={urls} setUrls={setUrls} loading={loading} />
                </TabsContent>
            </Tabs>
        </div>
    </div>
  );
}

export function Dashboard() {
    return (
        <SidebarProvider>
            <DashboardContent />
        </SidebarProvider>
    )
}

    