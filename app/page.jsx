"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [ordenes, setOrdenes] = useState([]);
  const [form, setForm] = useState({
    numero: "",
    fecha: "",
    nombre: "",
    dni: "",
    telefono: "",
    dispositivo: "",
    codigo: "",
    problema: "",
    notas: "",
    presupuesto: "",
    estado: "Recibido",
  });

  useEffect(() => {
    const datos = localStorage.getItem("ordenes");
    if (datos) setOrdenes(JSON.parse(datos));
  }, []);

  const guardar = (nuevas) => {
    setOrdenes(nuevas);
    localStorage.setItem("ordenes", JSON.stringify(nuevas));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    const nuevas = [...ordenes, form];
    guardar(nuevas);

    setForm({
      numero: "",
      fecha: "",
      nombre: "",
      dni: "",
      telefono: "",
      dispositivo: "",
      codigo: "",
      problema: "",
      notas: "",
      presupuesto: "",
      estado: "Recibido",
    });
  };

  const eliminar = (index) => {
    const nuevas = ordenes.filter((_, i) => i !== index);
    guardar(nuevas);
  };

  const cambiarEstado = (index, nuevoEstado) => {
    const nuevas = [...ordenes];
    nuevas[index].estado = nuevoEstado;
    guardar(nuevas);
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial", maxWidth: 900, margin: "auto" }}>
      
      <h1 style={{ textAlign: "center" }}>🛠️ Nueva Orden</h1>

      <div style={{ display: "grid", gap: 10, background: "#f5f5f5", padding: 15, borderRadius: 10 }}>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input name="numero" placeholder="Nº Orden" value={form.numero} onChange={handleChange} />
          <input type="date" name="fecha" value={form.fecha} onChange={handleChange} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} />
          <input name="dni" placeholder="DNI" value={form.dni} onChange={handleChange} />
        </div>

        <input name="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} />

        <hr />

        <input name="dispositivo" placeholder="Dispositivo" value={form.dispositivo} onChange={handleChange} />
        <input name="codigo" placeholder="Código bloqueo" value={form.codigo} onChange={handleChange} />
        <input name="problema" placeholder="Problema" value={form.problema} onChange={handleChange} />
        <input name="notas" placeholder="Notas" value={form.notas} onChange={handleChange} />
        <input name="presupuesto" placeholder="Presupuesto (€)" value={form.presupuesto} onChange={handleChange} />

        <select name="estado" value={form.estado} onChange={handleChange}>
          <option>Recibido</option>
          <option>Pendiente</option>
          <option>Pendiente de recambio</option>
          <option>Finalizado</option>
        </select>

        <button 
          onClick={handleSubmit}
          style={{
            padding: 12,
            background: "#000",
            color: "#fff",
            border: "none",
            borderRadius: 5,
            cursor: "pointer"
          }}
        >
          Guardar orden
        </button>
      </div>

      <h2 style={{ marginTop: 30 }}>📋 Órdenes</h2>

      {["Recibido", "Pendiente", "Pendiente de recambio", "Finalizado"].map((estado) => (
        <div key={estado} style={{ marginBottom: 25 }}>
          
          <h3 style={{ background: "#000", color: "#fff", padding: 5 }}>{estado}</h3>

          <table width="100%" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#ddd" }}>
                <th>Nº</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Dispositivo</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {ordenes
                .map((o, i) => ({ ...o, index: i }))
                .filter((o) => o.estado === estado)
                .map((o) => (
                  <tr key={o.index}>
                    <td>{o.numero}</td>
                    <td>{o.nombre}</td>
                    <td>{o.telefono}</td>
                    <td>{o.dispositivo}</td>
                    <td>
                      <button onClick={() => eliminar(o.index)}>❌</button>

                      <select
                        value={o.estado}
                        onChange={(e) => cambiarEstado(o.index, e.target.value)}
                      >
                        <option>Recibido</option>
                        <option>Pendiente</option>
                        <option>Pendiente de recambio</option>
                        <option>Finalizado</option>
                      </select>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
