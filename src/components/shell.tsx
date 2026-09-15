'use client';

/**
 * Navegação lateral e cabeçalho.
 *
 * Implementa as regras do doc 06: menu recolhível com preferência
 * persistida, perfil compacto no rodapé com menu de conta, e sobreposição
 * no celular.
 *
 * A navegação muda por perfil — o doc 01 é explícito: "o professor não
 * precisa visualizar toda a operação da 3ADS". Mostramos apenas o que
 * existe hoje; itens de etapas futuras não aparecem, para não prometer o
 * que ainda não há.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './shell.module.css';

export interface NavItem {
  href: string;
  label: string;
}

export interface ShellUser {
  name: string;
  email: string;
  avatarUrl: string | null;
  roleLabel: string;
}

const STORAGE_KEY = 'edu-sidebar-collapsed';

export function Shell({
  user,
  nav,
  children,
}: {
  user: ShellUser;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // A preferência é lida depois da montagem: no servidor não há
  // localStorage, e ler antes causaria divergência de hidratação.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === 'true');
    } catch {
      // Navegador com armazenamento bloqueado: segue expandido.
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Sem persistência, a preferência vale só nesta sessão.
      }
      return next;
    });
  };

  // Escape fecha o que estiver aberto — exigência do doc 06.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (accountOpen) setAccountOpen(false);
      else if (mobileOpen) setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [accountOpen, mobileOpen]);

  // Clique fora fecha o menu da conta.
  useEffect(() => {
    if (!accountOpen) return;
    const onClick = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [accountOpen]);

  // Navegar fecha a sobreposição do celular.
  useEffect(() => setMobileOpen(false), [pathname]);

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className={styles.app} data-collapsed={collapsed || undefined}>
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>

      <div
        className={styles.scrim}
        data-open={mobileOpen || undefined}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside className={styles.sidebar} data-open={mobileOpen || undefined}>
        <div className={styles.brand}>
          <span className={styles.brandName}>{collapsed ? 'EDU' : '3ADS EDU'}</span>
          <button
            type="button"
            className={styles.collapse}
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            <span aria-hidden="true">{collapsed ? '›' : '‹'}</span>
          </button>
        </div>

        <nav className={styles.nav} aria-label="Navegação principal">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={styles.navItem}
                data-active={active || undefined}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
              >
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.foot} ref={accountRef}>
          {accountOpen ? (
            <div className={styles.accountMenu} role="menu">
              <span className={styles.accountEmail}>{user.email}</span>
              <form action="/api/auth/signout" method="post">
                <button type="submit" role="menuitem" className={styles.accountAction}>
                  Sair
                </button>
              </form>
            </div>
          ) : null}

          <button
            type="button"
            className={styles.profile}
            onClick={() => setAccountOpen((open) => !open)}
            aria-expanded={accountOpen}
            aria-haspopup="menu"
          >
            <span className={styles.avatar} aria-hidden="true">
              {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials}
            </span>
            <span className={styles.profileText}>
              <strong>{user.name}</strong>
              <small>{user.roleLabel}</small>
            </span>
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <span aria-hidden="true">☰</span>
          </button>
          <span className={styles.topbarBrand}>3ADS EDU</span>
        </header>

        <main className={styles.content} id="conteudo">
          {children}
        </main>
      </div>
    </div>
  );
}
