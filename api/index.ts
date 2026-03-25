import express from "express";
// Vite is imported dynamically for dev mode to keep the serverless function lightweight.
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load Environment Variables
dotenv.config();

// Set Timezone to Brasília
process.env.TZ = 'America/Sao_Paulo';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to get Brasília time in ISO format
const getBrasiliaISO = () => {
  const date = new Date();
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date).replace(' ', 'T') + '-03:00';
};

// Helper to safely parse JSON (Supabase JSONB comes pre-parsed)
function safeParseJSON(val: any, fallback: any = []) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
}

const app = express();
const httpServer = createServer(app);

app.use(express.json());

// Auth Endpoints
app.post("/api/auth/login", async (req, res) => {
  const { registration, password } = req.body;
  if (registration?.length !== 6 || password?.length !== 8) {
    return res.status(400).json({ error: "Matrícula deve ter 6 dígitos e Senha deve ter 8 dígitos" });
  }
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("registration", registration)
    .eq("password", password)
    .single();

  if (user) {
    if (user.role === 'manager' && !user.is_active) {
      return res.status(403).json({ error: "approval_pending" });
    }
    res.json({ 
      ...user, 
      is_active: !!user.is_active,
      training_list: safeParseJSON(user.trainings),
      avatar_url: user.avatar_url || null
    });
  } else {
    res.status(401).json({ error: "Credenciais inválidas" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { name, registration, password, role, function: userFunction, email, phone, trainings, avatar_url } = req.body;
  
  if (registration?.length !== 6 || password?.length !== 8) {
    return res.status(400).json({ error: "Matrícula deve ter 6 dígitos e Senha deve ter 8 dígitos" });
  }
  
  const { data: newUser, error } = await supabase
    .from("users")
    .insert({
      name, 
      registration, 
      password, 
      role: role || 'employee', 
      function: userFunction || '', 
      email: email || '', 
      phone: phone || '', 
      trainings: Array.isArray(trainings) ? trainings : (typeof trainings === 'string' ? safeParseJSON(trainings) : []), 
      is_active: false, 
      avatar_url: avatar_url || null
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: "Esta matrícula já está cadastrada." });
    }
    return res.status(400).json({ error: `Erro no cadastro: ${error.message}` });
  }

  res.json({ 
    ...newUser, 
    is_active: !!newUser.is_active,
    training_list: safeParseJSON(newUser.trainings),
    avatar_url: newUser.avatar_url || null,
    avatar_position: newUser.avatar_position || 'center'
  });
});

app.patch("/api/users/:id/avatar", async (req, res) => {
  const { id } = req.params;
  const { avatar_url } = req.body;
  
  const { data: user, error } = await supabase
    .from("users")
    .update({ avatar_url })
    .eq("id", id)
    .select()
    .single();

  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  
  res.json({ 
    ...user, 
    is_active: !!user.is_active,
    training_list: safeParseJSON(user.trainings),
    avatar_url: user.avatar_url || null,
    avatar_position: user.avatar_position || 'center'
  });
});

app.patch("/api/users/:id/trainings", async (req, res) => {
  const { id } = req.params;
  const { training_list } = req.body;
  
  const { data: user, error } = await supabase
    .from("users")
    .update({ trainings: training_list || [] })
    .eq("id", id)
    .select()
    .single();

  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  
  res.json({ 
    ...user, 
    is_active: !!user.is_active,
    training_list: safeParseJSON(user.trainings),
    avatar_url: user.avatar_url || null,
    avatar_position: user.avatar_position || 'center'
  });
});

app.patch("/api/users/:id/status", async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  
  const { data: user, error } = await supabase
    .from("users")
    .update({ is_active })
    .eq("id", id)
    .select()
    .single();

  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  
  res.json({ 
    ...user, 
    is_active: !!user.is_active,
    training_list: safeParseJSON(user.trainings),
    avatar_url: user.avatar_url || null,
    avatar_position: user.avatar_position || 'center'
  });
});

// Users Endpoints
app.get("/api/users", async (req, res) => {
  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", "employee");
  
  if (error) return res.status(400).json({ error: error.message });

  res.json((users || []).map((u: any) => ({ 
    ...u, 
    is_active: !!u.is_active,
    training_list: safeParseJSON(u.trainings),
    avatar_url: u.avatar_url || null,
    avatar_position: u.avatar_position || 'center'
  })));
});

// Locations Endpoints
app.get("/api/locations", async (req, res) => {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .order("name");
  res.json(data || []);
});

// Activities Endpoints
app.get("/api/activities", async (req, res) => {
  const { startDate, endDate, userId, status } = req.query;
  
  let query = supabase
    .from("activities")
    .select(`
      *,
      users(name),
      locations(name)
    `)
    .order("created_at", { ascending: false });

  if (startDate) query = query.gte("created_at", `${startDate}T00:00:00-03:00`);
  if (endDate) query = query.lte("created_at", `${endDate}T23:59:59-03:00`);
  if (userId) query = query.eq("user_id", userId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });

  res.json((data || []).map((a: any) => ({
    ...a,
    user_name: a.users?.name,
    location_name: a.locations?.name,
    involved_employees: safeParseJSON(a.involved_employees)
  })));
});

app.post("/api/activities", async (req, res) => {
  const { 
    om_number, operation, model, code, involved_employees, 
    location_id, description, status, latitude, longitude, user_id 
  } = req.body;

  const now = getBrasiliaISO();
  
  const { data: activity, error } = await supabase
    .from("activities")
    .insert({
      om_number, operation, model, code, 
      involved_employees: involved_employees || [], 
      location_id, description, status, latitude, longitude, user_id,
      created_at: now,
      updated_at: now
    })
    .select()
    .single();

  if (error || !activity) {
    console.error(error);
    return res.status(400).json({ error: "Erro ao criar atividade" });
  }

  // Initial status history
  await supabase.from("status_history").insert({ 
    activity_id: activity.id, 
    status, 
    timestamp: now 
  });
  
  // Fetch names for broadcast and response
  const { data: user } = await supabase.from("users").select("name").eq("id", user_id).single();
  const { data: loc } = await supabase.from("locations").select("name").eq("id", location_id).single();

  const finalActivity = {
    ...activity,
    involved_employees: safeParseJSON(activity.involved_employees),
    user_name: user?.name,
    location_name: loc?.name
  };

  res.json(finalActivity);
});

app.patch("/api/activities/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status, justification } = req.body;
  
  const { data: activity } = await supabase.from("activities").select("*").eq("id", id).single();
  if (!activity) return res.status(404).json({ error: "Atividade não encontrada" });

  const { data: lastHistory } = await supabase
    .from("status_history")
    .select("*")
    .eq("activity_id", id)
    .order("timestamp", { ascending: false })
    .limit(1);
  
  const lastRec = lastHistory?.[0];
  if (lastRec) {
    const startTime = new Date(lastRec.timestamp).getTime();
    const endTime = new Date().getTime();
    const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

    if (lastRec.status === 'Em andamento') {
      await supabase.from("activities").update({ 
        total_active_time: (activity.total_active_time || 0) + durationMinutes 
      }).eq("id", id);
    } else if (lastRec.status === 'Pausada') {
      await supabase.from("activities").update({ 
        total_paused_time: (activity.total_paused_time || 0) + durationMinutes 
      }).eq("id", id);
    }
  }

  const now = getBrasiliaISO();
  await supabase.from("activities").update({ status, updated_at: now }).eq("id", id);
  await supabase.from("status_history").insert({ 
    activity_id: id, 
    status, 
    justification: justification || null, 
    timestamp: now 
  });
  
  res.json({ success: true });
});

app.get("/api/activities/:id/history", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("status_history")
    .select("*")
    .eq("activity_id", id)
    .order("timestamp", { ascending: true });
  res.json(data || []);
});

app.get("/api/activities/:id/messages", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      users(avatar_url, avatar_position)
    `)
    .eq("activity_id", id)
    .order("timestamp", { ascending: true });

  if (error) return res.status(400).json({ error: error.message });

  res.json((data || []).map((m: any) => ({
    ...m,
    user_avatar: m.users?.avatar_url || null,
    user_avatar_position: m.users?.avatar_position || 'center'
  })));
});

app.post("/api/activities/:id/messages", async (req, res) => {
  const { id: activityId } = req.params;
  const { userId, userName, text } = req.body;
  const now = getBrasiliaISO();

  const { data: activity } = await supabase.from("activities").select("om_number").eq("id", activityId).single();
  const { data: user } = await supabase.from("users").select("avatar_url, avatar_position").eq("id", userId).single();
  
  const { data: msg, error } = await supabase
    .from("messages")
    .insert({
      activity_id: activityId, 
      user_id: userId, 
      user_name: userName, 
      text, 
      timestamp: now
    })
    .select()
    .single();

  if (error || !msg) return res.status(400).json({ error: "Erro ao enviar mensagem" });

  const newMessage = {
    ...msg,
    user_avatar: user?.avatar_url || null,
    user_avatar_position: user?.avatar_position || 'center',
    om_number: activity?.om_number
  };

  res.json(newMessage);
});

// Occurrences Endpoints
app.get("/api/occurrences", async (req, res) => {
  const { data, error } = await supabase
    .from("occurrences")
    .select(`
      *,
      users(avatar_url, avatar_position)
    `)
    .order("timestamp", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });

  res.json((data || []).map((o: any) => ({
    ...o,
    user_avatar: o.users?.avatar_url || null,
    user_avatar_position: o.users?.avatar_position || 'center'
  })));
});

app.post("/api/occurrences", async (req, res) => {
  const { userId, userName, title, description, location, type, om_number } = req.body;
  const now = getBrasiliaISO();

  const { data: user } = await supabase.from("users").select("avatar_url, avatar_position").eq("id", userId).single();
  
  const { data: occ, error } = await supabase
    .from("occurrences")
    .insert({
      user_id: userId, 
      user_name: userName, 
      title, 
      description, 
      location, 
      type, 
      timestamp: now, 
      om_number,
      status: 'Não Solucionado'
    })
    .select()
    .single();

  if (error || !occ) return res.status(400).json({ error: "Erro ao criar ocorrência" });

  const newOccurrence = {
    ...occ,
    user_avatar: user?.avatar_url || null,
    user_avatar_position: user?.avatar_position || 'center'
  };

  res.json(newOccurrence);
});

app.put("/api/occurrences/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const { data: updatedOcc, error } = await supabase
    .from("occurrences")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: "Failed to update occurrence status" });
    
  res.json({ success: true, id: Number(id), status });
});

async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server: httpServer } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Note: On Vercel, static files are served by the platform, not Express.
    // This is kept for local production testing.
    const distPath = path.join(__dirname, "..", "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

// Only run Vite and listen if not on Vercel
if (!process.env.VERCEL) {
  setupVite().then(() => {
    const PORT = 3000;
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

export default app;

