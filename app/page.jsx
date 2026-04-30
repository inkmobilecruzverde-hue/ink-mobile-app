"use client";
import { useState, useEffect } from "react";

export default function Page() {
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({
    nombre: "",
    dni: "",
    telefono: "",
    dispositivo: "",
    bloqueo: "",
    problema: "",
    notas: "",
    presupuesto: "",
    estado: "Recibido"
  });

  useEffect(() => {
    const data = localStorage.getItem("orders");
    if (data) setOrders(JSON.parse(data));
  }, []);

  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addOrder = () => {
    const newOrder = {
      ...form,
      id: Date.now(),
      numero: orders.length + 1,
      fecha: new Date().toLocaleDateString()
    };
    setOrders([newOrder, ...orders]);
    setForm({
      nombre: "",
      dni: "",
      telefono: "",
      dispositivo: "",
      bloqueo: "",
      problema: "",
      notas: "",
      presupuesto: "",
      estado: "Recibido"
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Ink-Mobile</h1>

      <h2>Nueva Orden</h2>

      <input placeholder="Nombre" name="nombre" value={form.nombre} onChange={handleChange} />
      <input placeholder="DNI" name="dni" value={form.dni} onChange={handleChange} />
      <input placeholder="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} />
      <input placeholder="Dispositivo" name="dispositivo" value={form.dispositivo} onChange={handleChange} />
      <input placeholder="Código bloqueo" name="bloqueo" value={form.bloqueo} onChange={handleChange} />

      <textarea placeholder="Problema" name="problema" value={form.problema} onChange={handleChange} />
      <textarea placeholder="Notas" name="notas" value={form.notas} onChange={handleChange} />

      <input placeholder="Presupuesto (€)" name="presupuesto" value={form.presupuesto} onChange={handleChange} />

      <select name="estado" value={form.estado} onChange={handleChange}>
        <option>Recibido</option>
        <option>Pendiente</option>
        <option>Pendiente de recambio</option>
        <option>Finalizado</option>
      </select>

      <br /><br />
      <button onClick={addOrder}>Guardar</button>

      <hr />

      <h2>Órdenes</h2>

      {orders.map((o) => (
        <div key={o.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          <strong>#{o.numero} - {o.nombre}</strong><br />
          {o.dispositivo}<br />
          {o.problema}<br />
          Estado: {o.estado}<br />
          Fecha: {o.fecha}
        </div>
      ))}
    </div>
  );
}
