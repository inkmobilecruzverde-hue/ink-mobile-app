"use client";
import { useState, useEffect } from "react";

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

  const [ordenes, setOrdenes] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("ordenes")) || [];
    setOrdenes(data);
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const guardarOrden = () => {
    let nuevas = [...ordenes, form];
    localStorage.setItem("ordenes", JSON.stringify(nuevas));
    setOrdenes(nuevas);
    alert("Orden guardada 🔥");
  };

  return (
    <div>

      <h2>Órdenes guardadas</h2>

      <table border="1">
        <thead>
          <tr>
            <th>Nº</th>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Dispositivo</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {ordenes.map((o, i) => (
            <tr key={i}>
              <td>{o.numero}</td>
              <td>{o.nombre}</td>
              <td>{o.telefono}</td>
              <td>{o.dispositivo}</td>
              <td>{o.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>

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

      <br /><br />
      <button onClick={guardarOrden}>Guardar orden</button>

    </div>
  );
}
