"use client";
import { useState } from "react";

export default function Home() {
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

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const guardarOrden = () => {
    let ordenes = JSON.parse(localStorage.getItem("ordenes")) || [];
    ordenes.push(form);
    localStorage.setItem("ordenes", JSON.stringify(ordenes));
    alert("Orden guardada 🔥");
  };

  return (
    <div>
      <h1>Nueva Orden</h1>

      <input name="numero" placeholder="Nº Orden" onChange={handleChange} />
      <input name="fecha" type="date" onChange={handleChange} />
      <input name="nombre" placeholder="Nombre" onChange={handleChange} />
      <input name="dni" placeholder="DNI" onChange={handleChange} />
      <input name="telefono" placeholder="Teléfono" onChange={handleChange} />

      <input name="dispositivo" placeholder="Dispositivo" onChange={handleChange} />
      <input name="codigo" placeholder="Código bloqueo" onChange={handleChange} />
      <input name="problema" placeholder="Problema" onChange={handleChange} />
      <input name="notas" placeholder="Notas" onChange={handleChange} />
      <input name="presupuesto" placeholder="Presupuesto" onChange={handleChange} />

      <select name="estado" onChange={handleChange}>
        <option>Recibido</option>
        <option>Pendiente</option>
        <option>Pendiente de recambio</option>
        <option>Finalizado</option>
      </select>

      <button onClick={guardarOrden}>Guardar orden</button>
    </div>
  );
}
