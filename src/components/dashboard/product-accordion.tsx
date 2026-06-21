

"use client";

import { useMemo, useState } from 'react';
import type { Product } from '@/types';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, SearchX, TrendingUp, Copy, Check } from 'lucide-react';
import { formatCurrency, isValidImageUrl, cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { buttonVariants } from '@/components/ui/button';


interface ProductAccordionProps {
  products: Product[];
  loading: boolean;
}

export function ProductAccordion({ products, loading }: ProductAccordionProps) {
  const groupedProducts = useMemo(() => {
    return products.reduce((acc, product) => {
      const key = product.ean || product.id;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [products]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (Object.keys(groupedProducts).length === 0) {
    return (
      <Card className="text-center py-16 px-4 shadow-none border-dashed">
        <div className="flex justify-center mb-4">
            <div className="bg-secondary p-4 rounded-full">
                <SearchX className="h-12 w-12 text-muted-foreground" />
            </div>
        </div>
        <h3 className="text-xl font-semibold">Nenhum produto encontrado</h3>
        <p className="text-muted-foreground mt-2">Tente ajustar ou limpar seus filtros para ver mais resultados.</p>
      </Card>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full space-y-4">
      {Object.entries(groupedProducts).map(([ean, productGroup], index) => (
        <ProductAccordionItem 
          key={`${ean}-${index}`} 
          ean={ean} 
          productGroup={productGroup} 
        />
      ))}
    </Accordion>
  );
}

function ProductAccordionItem({ ean, productGroup }: { ean: string, productGroup: Product[]}) {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    
    const { firstProduct, imageSrc } = useMemo(() => {
        const priority = ['Beleza na Web', 'Mercado Livre', 'Época Cosméticos', 'Amazon', 'Magazine Luiza'];
        let chosen = null;
        for (const mp of priority) {
            chosen = productGroup.find(p => p.marketplace === mp && isValidImageUrl(p.image)) || null;
            if (chosen) break;
        }
        if (!chosen) chosen = productGroup.find(p => isValidImageUrl(p.image)) || null;

        return {
            firstProduct: chosen || productGroup[0],
            imageSrc: chosen?.image || `https://placehold.co/100x100.png`,
        };

    }, [productGroup]);

    const prices = productGroup.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const mostRecentUpdate = useMemo(() => {
        if (!productGroup || productGroup.length === 0) {
            return null;
        }
        const validDates = productGroup
            .map(p => p.updated_at ? new Date(p.updated_at) : null)
            .filter((d): d is Date => d !== null && !isNaN(d.getTime()));
    
        if (validDates.length === 0) {
            return null;
        }
    
        const mostRecentDate = new Date(Math.max(...validDates.map(d => d.getTime())));
        return mostRecentDate;
    }, [productGroup]);

    const totalChanges = useMemo(() => {
        return productGroup.reduce((sum, p) => sum + (p.change_price || 0), 0);
    }, [productGroup]);

    const offersByMarketplace = useMemo(() => {
        return productGroup.reduce((acc, product) => {
            const marketplace = product.marketplace || 'Outros';
            if (!acc[marketplace]) {
                acc[marketplace] = [];
            }
            acc[marketplace].push(product);
            return acc;
        }, {} as Record<string, Product[]>);
    }, [productGroup]);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(ean);
        setIsCopied(true);
        toast({
            title: "EAN Copiado!",
            description: `O EAN ${ean} foi copiado para a área de transferência.`,
        })
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <AccordionItem value={ean} className="border-none">
            <Card className="overflow-hidden transition-all hover:shadow-lg">
                <AccordionTrigger className="p-4 text-left hover:no-underline [&[data-state=open]>div>div>svg]:rotate-180">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full">
                        <Image
                            src={imageSrc}
                            alt={firstProduct.name}
                            width={100}
                            height={100}
                            className="rounded-md object-cover border"
                            data-ai-hint="cosmetics bottle"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null; // prevents looping
                                target.src = `https://placehold.co/100x100.png`;
                            }}
                        />
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground font-medium">{firstProduct.brand}</p>
                            <h3 className="font-semibold text-lg text-foreground">{firstProduct.name}</h3>
                             <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-muted-foreground">EAN: {ean}</p>
                                <div
                                    role="button"
                                    tabIndex={0}
                                    aria-label="Copiar EAN"
                                    onClick={handleCopy}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCopy(e); }}
                                    className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-5 w-5 cursor-pointer')}
                                >
                                    {isCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-1 w-full md:w-auto">
                            <p className="text-sm text-muted-foreground">Preços a partir de</p>
                            <p className="text-2xl font-bold text-primary">{formatCurrency(minPrice)}</p>
                            {mostRecentUpdate && (
                                <p className="text-xs text-muted-foreground">
                                    Atualizado {formatDistanceToNow(mostRecentUpdate, { addSuffix: true, locale: ptBR })}
                                </p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap justify-end mt-1">
                                {productGroup.length > 1 && (
                                    <Badge variant="secondary">Variação: {formatCurrency(minPrice)} - {formatCurrency(maxPrice)}</Badge>
                                )}
                                <Badge variant="outline">{productGroup.length} oferta{productGroup.length > 1 ? 's' : ''}</Badge>
                                {totalChanges > 0 && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        {totalChanges} alteraç{totalChanges > 1 ? 'ões' : 'ão'}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="px-6 pb-4">
                        <h4 className="font-semibold mb-2 text-foreground">Ofertas disponíveis ({productGroup.length})</h4>
                         <Accordion type="multiple" className="w-full space-y-2">
                             {Object.entries(offersByMarketplace).map(([marketplace, offers]) => (
                                 <AccordionItem key={marketplace} value={marketplace} className="border rounded-lg">
                                     <AccordionTrigger className="px-4 py-2 text-left hover:no-underline bg-muted/50">
                                        <div className="flex justify-between w-full items-center">
                                             <h5 className="font-semibold">{marketplace} <span className="font-normal text-muted-foreground">({offers.length} ofertas)</span></h5>
                                             <Badge variant="outline">A partir de {formatCurrency(Math.min(...offers.map(o => o.price)))}</Badge>
                                        </div>
                                     </AccordionTrigger>
                                     <AccordionContent className="p-0">
                                        <div className="border-t">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Loja (Seller)</TableHead>
                                                        <TableHead className="text-right">Preço</TableHead>
                                                        <TableHead>Alterações</TableHead>
                                                        <TableHead>Última Atualização</TableHead>
                                                        <TableHead></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {offers.sort((a,b) => a.price - b.price).map((product, index) => (
                                                    <TableRow key={`${product.id}-${index}`}>
                                                        <TableCell>{product.seller}</TableCell>
                                                        <TableCell className={`font-bold text-right ${product.price === minPrice ? 'text-primary' : 'text-foreground'}`}>
                                                            {formatCurrency(product.price)}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground text-sm text-center">
                                                            {product.change_price && product.change_price > 0 ? product.change_price : '-'}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground text-sm">
                                                            {product.updated_at ? formatDistanceToNow(new Date(product.updated_at), { addSuffix: true, locale: ptBR }) : '-'}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button asChild variant="ghost" size="icon" disabled={!product.url}>
                                                                <a href={product.url} target="_blank" rel="noopener noreferrer" aria-label="Ver produto">
                                                                    <ExternalLink className="h-4 w-4"/>
                                                                </a>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                     </AccordionContent>
                                 </AccordionItem>
                             ))}
                         </Accordion>
                    </div>
                </AccordionContent>
            </Card>
        </AccordionItem>
    );
}
