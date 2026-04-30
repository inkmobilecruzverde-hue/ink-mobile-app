"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [ordenes, setOrdenes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
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
    foto: "",
  });

  // 🔥 Cargar datos
  useEffect(() => {
    const datos = localStorage.getItem("ordenes");
    if (datos) setOrdenes(JSON.parse(datos));
  }, []);

  // 🔥 Generar número automático
  const generarNumero = () => {
    if (ordenes.length === 0) return 1;
    return Math.max(...ordenes.map(o => Number(o.numero))) + 1;
  };

  // 🔥 Fecha automática
  const fechaHoy = () => {
    return new Date().toISOString().split("T")[0];
  };

  const guardar = (nuevas) => {
    setOrdenes(nuevas);
    localStorage.setItem("ordenes", JSON.stringify(nuevas));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, foto: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    const nuevaOrden = {
      ...form,
      numero: generarNumero(),
      fecha: fechaHoy(),
    };

    const nuevas = [...ordenes, nuevaOrden];
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
      foto: "",
    });
  };

  const eliminar = (index) => {
    const nuevas = ordenes.filter((_, i) => i !== index);
    guardar(nuevas);
  };

  const cambiarEstado = (index, estado) => {
    const nuevas = [...ordenes];
    nuevas[index].estado = estado;
    guardar(nuevas);
  };

  const filtradas = ordenes.filter(o =>
    o.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    o.telefono?.includes(busqueda)
  );

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "auto", fontFamily: "Arial" }}>
      
      <h1>🛠️ Nueva Orden</h1>

      <div style={{ display: "grid", gap: 10, background: "#f5f5f5", padding: 15, borderRadius: 10 }}>

        <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} />
        <input name="dni" placeholder="DNI" value={form.dni} onChange={handleChange} />
        <input name="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} />

        <input name="dispositivo" placeholder="Dispositivo" value={form.dispositivo} onChange={handleChange} />
        <input name="codigo" placeholder="Código bloqueo" value={form.codigo} onChange={handleChange} />
        <input name="problema" placeholder="Problema" value={form.problema} onChange={handleChange} />
        <input name="notas" placeholder="Notas" value={form.notas} onChange={handleChange} />
        <input name="presupuesto" placeholder="Presupuesto (€)" value={form.presupuesto} onChange={handleChange} />

        <input type="file" accept="image/*" onChange={handleFoto} />

        <select name="estado" value={form.estado} onChange={handleChange}>
          <option>Recibido</option>
          <option>Pendiente</option>
          <option>Pendiente de recambio</option>
          <option>Finalizado</option>
        </select>

        <button onClick={handleSubmit} style={{ padding: 10, background: "black", color: "white" }}>
          Guardar orden
        </button>
      </div>

      <h2 style={{ marginTop: 20 }}>🔍 Buscar</h2>
      <input
        placeholder="Buscar por nombre o teléfono"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <h2 style={{ marginTop: 20 }}>📋 Órdenes</h2>

      {["Recibido", "Pendiente", "Pendiente de recambio", "Finalizado"].map((estado) => (
        <div key={estado}>
          <h3>{estado}</h3>

          <table border="1" width="100%">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Fecha</th>
                <th>Nombre</th>
                <th>Dispositivo</th>
                <th>Foto</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtradas
                .map((o, i) => ({ ...o, index: i }))
                .filter(o => o.estado === estado)
                .map(o => (
                  <tr key={o.index}>
                    <td>{o.numero}</td>
                    <td>{o.fecha}</td>
                    <td>{o.nombre}</td>
                    <td>{o.dispositivo}</td>
                    <td>
                      {o.foto && <img src={o.foto} width="50" />}
                    </td>
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
