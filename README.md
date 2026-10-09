# Ruby Bet Hub — versão Supabase

## O que já está implementado
- Interface responsiva com logo oficial, favicon e ícone de instalação.
- Home pública que lê os cadastros do Supabase em ordem configurável.
- Login via Supabase Auth e validação de administradores por tabela + Row Level Security (RLS).
- Administrador pode adicionar, editar e excluir plataformas em tempo real para todos.
- Upload de ícones para Supabase Storage (bucket público com escrita restrita).
- Favicon automático da plataforma como alternativa ao upload.
- Visualização vertical de até 430 px no desktop e largura de tela no celular, com barra retrátil.

## Passos para conectar
1. Crie um projeto em https://supabase.com/dashboard e abra **SQL Editor**.
2. Cole todo o conteúdo de `supabase.sql` e clique Run.
3. Em **Authentication > Users**, crie um usuário com email e senha (somente você). Se houver convite/confirmação, conclua o processo.
4. Copie o **User UID** desse usuário. No SQL Editor, execute:
   `insert into public.admins(user_id) values ('COLE-AQUI-O-UUID');`
5. Em **Project Settings / Connect / API Keys**, copie a **Project URL** e a chave **publishable** (ou anon legacy) para `config.js`. Nunca copie `service_role`, `sb_secret_...` ou a senha para esse arquivo.
6. Publique todos os arquivos (inclusive `assets`, `config.js` e `app.js`) em uma hospedagem estática HTTPS como Vercel, Netlify ou GitHub Pages. Se estiver usando Vercel, importe a pasta como projeto estático sem framework. Defina o diretório raiz como pasta que contém `index.html`.
7. No Supabase, em **Authentication > URL Configuration**, adicione o endereço final em Site URL e Allowed Redirect URLs se utilizar fluxos de e-mail.
8. Entre em **Administrador** no site, faça login e cadastre a primeira plataforma.

## Notas importantes
- Nada foi implantado automaticamente na sua conta Supabase: você ainda precisa criar o projeto e fornecer/configurar os dados públicos.
- Sem `config.js` preenchido, a interface mostra um aviso e não faz alterações.
- **Não existe mais senha padrão local**: a autenticação ocorre no Supabase.
- Usuários comuns acessam a home sem login. Somente a conta incluída na tabela `admins` edita. A regra é garantida no banco com RLS, não apenas ocultando botões.
- Alguns sites impedem incorporação em iframe via CSP/X-Frame-Options. Nesses casos, use o botão de abertura externa. Nem todo site pode operar na janela vertical.
- O link cadastrado deve usar HTTPS. Não é possível obrigar sites externos a manter sessão/cookies em iframes.
- A tabela `platforms` é pública para leitura: o conteúdo não é confidencial. Para um hub apenas por convite, seria necessário ativar login de visitantes e restringir a política SELECT.
- Ícones enviados para o Storage são públicos; evite conteúdo privado.
- Não divulgue links de plataformas sem confirmar permissões/termos e a legislação vigente.

### Navegação na dock lateral
A barra superior foi removida. A dock vertical à esquerda tem um botão de lobby e ícones de todas as plataformas carregadas do Supabase. Trocar de plataforma substitui o iframe ativo. O botão inferior abre a plataforma atual em outra aba quando necessário.
