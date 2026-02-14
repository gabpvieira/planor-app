import { useMemo } from 'react';
import { useUserSettings } from './use-user-settings';
import { format, formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

/**
 * Hook para trabalhar com datas respeitando o timezone do usuário
 */
export function useTimezone() {
  const { settings } = useUserSettings();
  const timezone = settings.timezone || 'America/Sao_Paulo';

  return useMemo(() => ({
    timezone,
    
    /**
     * Converte uma data UTC para o timezone do usuário
     */
    toUserTime: (date: Date | string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return toZonedTime(d, timezone);
    },
    
    /**
     * Converte uma data do timezone do usuário para UTC
     */
    toUTC: (date: Date | string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return fromZonedTime(d, timezone);
    },
    
    /**
     * Formata uma data UTC no timezone do usuário
     */
    formatInUserTimezone: (date: Date | string, formatStr: string = 'PPpp') => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return formatInTimeZone(d, timezone, formatStr, { locale: ptBR });
    },
    
    /**
     * Retorna a hora atual no timezone do usuário
     */
    now: () => toZonedTime(new Date(), timezone),
    
    /**
     * Retorna o offset do timezone em horas
     */
    getOffset: () => {
      const now = new Date();
      const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
    },
    
    /**
     * Formata o offset como string (ex: "GMT-3")
     */
    getOffsetString: () => {
      const offset = (() => {
        const now = new Date();
        const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
        const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
      })();
      const sign = offset >= 0 ? '+' : '';
      return `GMT${sign}${offset}`;
    },
  }), [timezone]);
}

/**
 * Formata uma data para exibição respeitando o timezone
 * Uso: formatUserDate(date, 'dd/MM/yyyy HH:mm', 'America/Sao_Paulo')
 */
export function formatUserDate(
  date: Date | string,
  formatStr: string,
  timezone: string = 'America/Sao_Paulo'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(d, timezone, formatStr, { locale: ptBR });
}
