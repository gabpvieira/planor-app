import type { Express, RequestHandler } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Usuário de desenvolvimento padrão
const DEV_USER = {
  email: "dev@teste.com",
  password: "123456",
  firstName: "Dev",
  lastName: "User",
};

export function setupAuth(app: Express) {
  const SessionStore = MemoryStore(session);
  
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dev-secret",
      store: new SessionStore({
        checkPeriod: 86400000, // 24h
      }),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      },
    })
  );

  // Middleware para adicionar user da sessão ao request
  app.use((req: any, res, next) => {
    if (req.session.user) {
      req.user = req.session.user;
    }
    next();
  });
}

export function registerAuthRoutes(app: Express) {
  // Rota para obter usuário atual
  app.get("/api/user", (req: any, res) => {
    res.json(req.user || null);
  });

  // Rota de login com Supabase (NOVA)
  app.post("/api/supabase-login", async (req: any, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      // Criar sessão simulada para o usuário do Supabase
      // O frontend usará o Supabase Auth diretamente
      req.session.user = {
        id: email, // Temporário - o frontend gerenciará a autenticação real
        email: email,
        firstName: email.split('@')[0],
        lastName: '',
      };

      return res.json({
        id: email,
        email: email,
        firstName: email.split('@')[0],
        lastName: '',
        message: 'Use Supabase Auth no frontend'
      });
    } catch (error) {
      console.error("Erro no login Supabase:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rota de login (ANTIGA - mantida para compatibilidade)
  app.post("/api/login", async (req: any, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      // Para o usuário dev, buscar do banco de dados
      if (email === DEV_USER.email && password === DEV_USER.password) {
        // Buscar usuário real do banco
        const [dbUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        
        if (!dbUser) {
          // Criar usuário se não existir
          const [newUser] = await db.insert(users).values({
            email: DEV_USER.email,
            firstName: DEV_USER.firstName,
            lastName: DEV_USER.lastName,
          }).returning();
          
          req.session.user = {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
          };

          return res.json({
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
          });
        }

        req.session.user = {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
        };

        return res.json({
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
        });
      }

      // Para outros usuários, buscar do banco
      const [dbUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      if (dbUser) {
        req.session.user = {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
        };

        return res.json({
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
        });
      }

      return res.status(401).json({ 
        message: "Credenciais inválidas" 
      });
    } catch (error) {
      console.error("Erro no login:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rota de logout
  app.post("/api/logout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.json({ success: true });
    });
  });

  // Rota de registro (simplificada para desenvolvimento)
  app.post("/api/register", async (req: any, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      // Verificar se usuário já existe
      const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (existingUser) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }

      // Criar novo usuário
      const [newUser] = await db.insert(users).values({
        email,
        firstName: firstName || null,
        lastName: lastName || null,
      }).returning();

      // Fazer login automático
      req.session.user = {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      };

      return res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      });
    } catch (error) {
      console.error("Erro no registro:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
}

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  if (req.user) {
    return next();
  }
  res.status(401).json({ message: "Não autorizado" });
};

export const getUserId = (req: any): string => {
  return req.user?.id;
};
