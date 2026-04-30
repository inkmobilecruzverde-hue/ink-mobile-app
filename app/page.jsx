"use client";
import { useState } from "react";

export default function Home() {
  const [orden, setOrden] = useState({
    numero: "",
    fecha: new Date().toISOString().split("T")[0],
    nombre: "",
    dni: "",
    telefono: "",
    dispositivo: "",
    codigo: "",
    problema: "",
    notas: "",
    presupuesto: "",
    estado: "recibido",
    foto: null,
  });

  const handleChange = (e) => {
    setOrden({ ...orden, [e.target.name]: e.target.value });
  };

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      setOrden({ ...orden, foto: URL.createObjectURL(file) });
    }
  };

  const guardar = () => {
    console.log("ORDEN:", orden);
    alert("Orden guardada (de momento en consola)");
  };

  return (
    <main style={styles.container}>
      <h1>🛠️ Nueva Orden</h1>

      {/* CLIENTE */}
      <h2>📋 Datos cliente</h2>
      <div style={styles.grid}>
        <input name="numero" placeholder="Nº Orden" onChange={handleChange} />
        <input name="fecha" type="date" value={orden.fecha} onChange={handleChange} />
        <input name="nombre" placeholder="Nombre" onChange={handleChange} />
        <input name="dni" placeholder="DNI" onChange={handleChange} />
        <input name="telefono" placeholder="Teléfono" onChange={handleChange} />
      </div>

      {/* DISPOSITIVO */}
      <h2>📱 Dispositivo</h2>
      <div style={styles.grid}>
        <input name="dispositivo" placeholder="Dispositivo" onChange={handleChange} />
        <input name="codigo" placeholder="Código bloqueo" onChange={handleChange} />
        <input name="problema" placeholder="Problema" onChange={handleChange} />
        <input name="notas" placeholder="Notas" onChange={handleChange} />
        <input name="presupuesto" placeholder="Presupuesto €" onChange={handleChange} />
      </div>

      {/* FOTO */}
      <h2>📸 Estado del equipo</h2>
      <input type="file" accept="image/*" capture="environment" onChange={handleFoto} />
      {orden.foto && <img src={orden.foto} style={{ width: 200, marginTop: 10 }} />}

      {/* ESTADO */}
      <h2>📊 Estado</h2>
      <select name="estado" value={orden.estado} onChange={handleChange}>
        <option value="recibido">Recibido</option>
        <option value="pendiente">Pendiente</option>
        <option value="recambio">Pendiente recambio</option>
        <option value="finalizado">Finalizado</option>
      </select>

      <br /><br />

      <button onClick={guardar} style={styles.button}>
        Guardar orden
      </button>
    </main>
  );
}

const styles = {
  container: {
    padding: 20,
    maxWidth: 700,
    margin: "auto",
    fontFamily: "Arial",
  },
  grid: {
    display: "grid",
    gap: 10,
    marginBottom: 20,
  },
  button: {
    padding: 10,
    background: "black",
    color: "white",
    border: "none",
    borderRadius: 8,
  },
};
