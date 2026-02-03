import "dotenv/config";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Iniciando seed do banco de dados...");

  try {
    // Criar usuário de desenvolvimento
    const devEmail = "dev@teste.com";
    
    // Verificar se o usuário já existe
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, devEmail))
      .limit(1);

    if (existingUser) {
      console.log("✅ Usuário de desenvolvimento já existe:", devEmail);
    } else {
      const [newUser] = await db
        .insert(users)
        .values({
          email: devEmail,
          firstName: "Dev",
          lastName: "User",
        })
        .returning();

      console.log("✅ Usuário de desenvolvimento criado:", newUser.email);
      console.log("📧 Email:", devEmail);
      console.log("🔑 Senha: 123456");
    }

    console.log("✨ Seed concluído com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao executar seed:", error);
    process.exit(1);
  }
}

seed().catch(console.error);
