import * as React from 'react';
import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search, Building2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BRAZILIAN_BANKS, type BrazilianBank } from '@/data/brazilian-banks';

interface BankSelectProps {
  value?: string | null;
  onSelect: (bank: BrazilianBank | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Componente de logo do banco com fallback
function BankLogo({ bank, size = 24 }: { bank: BrazilianBank | null; size?: number }) {
  const [imgError, setImgError] = useState(false);
  
  if (!bank || imgError) {
    return (
      <div 
        className="flex items-center justify-center rounded-lg bg-muted shrink-0"
        style={{ width: size, height: size }}
      >
        <Building2 className="text-muted-foreground" style={{ width: size * 0.6, height: size * 0.6 }} />
      </div>
    );
  }

  return (
    <div 
      className="flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <img
        src={bank.logo}
        alt={bank.shortName}
        className="object-contain"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    </div>
  );
}

export function BankSelect({ 
  value, 
  onSelect, 
  placeholder = "Selecione um banco...",
  disabled = false,
  className 
}: BankSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedBank = value 
    ? BRAZILIAN_BANKS.find(bank => bank.slug === value) 
    : null;

  const filteredBanks = useMemo(() => {
    if (!search) return BRAZILIAN_BANKS;
    
    const normalizedSearch = search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return BRAZILIAN_BANKS.filter(bank => {
      const normalizedName = bank.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normalizedShortName = bank.shortName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return (
        normalizedName.includes(normalizedSearch) ||
        normalizedShortName.includes(normalizedSearch) ||
        bank.code.includes(search)
      );
    });
  }, [search]);

  const handleSelect = (bank: BrazilianBank) => {
    onSelect(bank);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal h-10",
            !selectedBank && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedBank ? (
              <>
                <BankLogo bank={selectedBank} size={20} />
                <span className="truncate">{selectedBank.shortName}</span>
                <span className="text-xs text-muted-foreground">— {selectedBank.code}</span>
              </>
            ) : (
              <>
                <Building2 className="size-4 text-muted-foreground shrink-0" />
                <span>{placeholder}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {selectedBank && (
              <X 
                className="size-4 text-muted-foreground hover:text-foreground cursor-pointer" 
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="size-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <div className="flex items-center border-b px-3 py-2">
          <Search className="size-4 shrink-0 opacity-50 mr-2" />
          <input
            placeholder="Buscar banco por nome ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          {search && (
            <X 
              className="size-4 text-muted-foreground hover:text-foreground cursor-pointer shrink-0" 
              onClick={() => setSearch('')}
            />
          )}
        </div>
        
        <ScrollArea className="h-[280px]">
          {filteredBanks.length === 0 ? (
            <div className="py-8 text-center">
              <Building2 className="size-10 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Banco não encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Você pode cadastrar manualmente
              </p>
            </div>
          ) : (
            <div className="p-1">
              {filteredBanks.map((bank) => (
                <button
                  key={bank.slug}
                  onClick={() => handleSelect(bank)}
                  className={cn(
                    "flex items-center gap-3 w-full px-2 py-2 rounded-md text-left transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                    selectedBank?.slug === bank.slug && "bg-accent"
                  )}
                >
                  <BankLogo bank={bank} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{bank.shortName}</p>
                    <p className="text-xs text-muted-foreground truncate">{bank.name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono shrink-0">{bank.code}</span>
                  {selectedBank?.slug === bank.slug && (
                    <Check className="size-4 shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export { type BrazilianBank };
