/**
 * Entrada. Dois caminhos, conforme D-001: SSO para a equipe 3ADS e link
 * mágico para professores e clientes. A tela definitiva entra em E2, com o
 * design system de docs/11.
 */
export default function Entrar() {
  return (
    <main>
      <h1>Portal 3ADS EDU</h1>
      <p>Informe seu e-mail para receber o link de acesso.</p>
      <form action="/api/auth/signin/nodemailer" method="post">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
        <button type="submit">Receber link de acesso</button>
      </form>
      <form action="/api/auth/signin/google" method="post">
        <button type="submit">Entrar com a conta 3ADS</button>
      </form>
    </main>
  );
}
