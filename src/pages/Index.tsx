import React, { useState, useMemo, useEffect } from 'react';
import ForecastTable from '@/components/ForecastTable';
import ProductHeader from '@/components/ProductHeader';
import FilterComponent from '@/components/FilterComponent';
import UserHeader from '@/components/UserHeader';
import { useQuery } from '@tanstack/react-query';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';

interface Produto {
  codigo: string;
  produto: string;
  marca: string;
  fabrica: string;
  familia1: string;
  familia2: string;
  empresa: string;
}

const ITEMS_PER_PAGE = 10;
const MAX_PAGE_LINKS = 5;

const LoadingPlaceholder = () => <div className="space-y-12">
    {[1, 2, 3].map(i => <div key={i} className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded w-full"></div>
            <div className="h-6 bg-gray-200 rounded w-full"></div>
            <div className="h-6 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>)}
  </div>;

const Index = () => {
  const [selectedEmpresas, setSelectedEmpresas] = useState<string[]>([]); // Novo estado para empresas
  const [selectedMarcas, setSelectedMarcas] = useState<string[]>([]);
  const [selectedFabricas, setSelectedFabricas] = useState<string[]>([]);
  const [selectedFamilia1, setSelectedFamilia1] = useState<string[]>([]);
  const [selectedFamilia2, setSelectedFamilia2] = useState<string[]>([]);
  const [selectedProdutos, setSelectedProdutos] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: produtos,
    isLoading,
    error
  } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      console.log('Fetching produtos from Azure SQL...');
      const response = await fetch('/api/produtos');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      console.log('Fetched produtos:', data);
      return data as Produto[];
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEmpresas, selectedMarcas, selectedFabricas, selectedFamilia1, selectedFamilia2, selectedProdutos]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [currentPage]);

  const getFilteredProducts = (allProducts: Produto[] | null, empresas: string[], marcas: string[], fabricas: string[], familia1: string[], familia2: string[], produtos: string[]) => {
    if (!allProducts) return [];
    return allProducts.filter(produto => {
      const matchesEmpresa = empresas.length === 0 || empresas.includes(produto.empresa);
      const matchesMarca = marcas.length === 0 || marcas.includes(produto.marca);
      const matchesFabrica = fabricas.length === 0 || fabricas.includes(produto.fabrica);
      const matchesFamilia1 = familia1.length === 0 || familia1.includes(produto.familia1);
      const matchesFamilia2 = familia2.length === 0 || familia2.includes(produto.familia2);
      const matchesProduto = produtos.length === 0 || produtos.includes(produto.produto);
      return matchesEmpresa && matchesMarca && matchesFabrica && matchesFamilia1 && matchesFamilia2 && matchesProduto;
    });
  };

  const filteredProdutos = useMemo(() => {
    return getFilteredProducts(produtos, selectedEmpresas, selectedMarcas, selectedFabricas, selectedFamilia1, selectedFamilia2, selectedProdutos);
  }, [produtos, selectedEmpresas, selectedMarcas, selectedFabricas, selectedFamilia1, selectedFamilia2, selectedProdutos]);

  const totalPages = Math.ceil((filteredProdutos?.length || 0) / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredProdutos?.length || 0);
  const currentProdutos = filteredProdutos?.slice(startIndex, endIndex) || [];

  const filters = useMemo(() => {
    if (!produtos) return {
      empresas: [],
      marcas: [],
      fabricas: [],
      familia1: [],
      familia2: [],
      produtos: []
    };
    return {
      empresas: Array.from(new Set(produtos.map(p => p.empresa))).sort(),
      marcas: Array.from(new Set(produtos.map(p => p.marca))).sort(),
      fabricas: Array.from(new Set(produtos.map(p => p.fabrica))).sort(),
      familia1: Array.from(new Set(produtos.map(p => p.familia1))).sort(),
      familia2: Array.from(new Set(produtos.map(p => p.familia2))).sort(),
      produtos: Array.from(new Set(produtos.map(p => p.produto))).sort()
    };
  }, [produtos]);

  const getPaginationItems = (currentPage, totalPages) => {
    const pages = [];
    const half = Math.floor(MAX_PAGE_LINKS / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, currentPage + half);
    if (currentPage - half <= 0) {
      end = Math.min(totalPages, end + (half - currentPage + 1));
    }
    if (currentPage + half > totalPages) {
      start = Math.max(1, start - (currentPage + half - totalPages));
    }
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('ellipsis');
      }
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('ellipsis');
      }
      pages.push(totalPages);
    }
    return pages;
  };

  if (error) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-[95%] mx-auto py-6">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-red-100/50 p-6">
          <div className="text-red-600">Erro ao carregar dados: {(error as Error).message}</div>
        </div>
      </div>
    </div>;
  }

  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <div className="max-w-[95%] mx-auto py-6">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100/50 p-6 mb-4 py-[3px]">
        <div className="flex justify-between items-center">
          <h1 className="uppercase text-black text-3xl font-normal">
            S&OP GRUPO CLASSIC
          </h1>
          <UserHeader />
        </div>
        <div className="mt-6 grid grid-cols-6 gap-3">
          <FilterComponent label="Empresa" options={filters.empresas} selectedValues={selectedEmpresas} onSelectionChange={setSelectedEmpresas} />
          <FilterComponent label="Marca" options={filters.marcas} selectedValues={selectedMarcas} onSelectionChange={setSelectedMarcas} />
          <FilterComponent label="Fábrica" options={filters.fabricas} selectedValues={selectedFabricas} onSelectionChange={setSelectedFabricas} />
          <FilterComponent label="Família 2" options={filters.familia2} selectedValues={selectedFamilia2} onSelectionChange={setSelectedFamilia2} />
          <FilterComponent label="Família 1" options={filters.familia1} selectedValues={selectedFamilia1} onSelectionChange={setSelectedFamilia1} />
          <FilterComponent label="Produto" options={filters.produtos} selectedValues={selectedProdutos} onSelectionChange={setSelectedProdutos} />
        </div>
        <div className="mt-4">
          <p className="text-black">
            {filteredProdutos.length} Produtos Ativos | Página {currentPage} de {totalPages || 1}
          </p>
        </div>
      </div>
      {isLoading ? <LoadingPlaceholder /> : <>
          <div className="space-y-12">
            {currentProdutos.length > 0 ? currentProdutos.map(produto => <div key={produto.produto} className="space-y-0">
                  <ProductHeader produto={produto.produto} />
                  <ForecastTable produto={produto.produto} />
                </div>) : <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 text-center">
                <p>Nenhum produto encontrado com os filtros selecionados.</p>
              </div>}
          </div>
          {totalPages > 1 && <div className="mt-8 mb-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} aria-disabled={currentPage === 1} />
                  </PaginationItem>
                  {getPaginationItems(currentPage, totalPages).map((page, index) => <PaginationItem key={index}>
                      {page === 'ellipsis' ? <PaginationEllipsis /> : <PaginationLink onClick={() => setCurrentPage(Number(page))} isActive={currentPage === page} className="cursor-pointer">
                          {page}
                        </PaginationLink>}
                    </PaginationItem>)}
                  <PaginationItem>
                    <PaginationNext onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} aria-disabled={currentPage === totalPages} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>}
        </>}
    </div>
  </div>;
};

export default Index;
