"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [clientes, setClientes] = useState([]);
  const [nombreCliente, setNombreCliente] = useState("");

  useEffect(() => {
    const data = localStorage.getItem("clientes");
    if (data) setClientes(JSON.parse(data));
  }, []);

  useEffect(() => {
    localStorage.setItem("clientes", JSON.stringify(clientes));
  }, [clientes]);

  const añadirCliente = () => {
    if (!nombreCliente) return;
    setClientes([...clientes, { nombre: nombreCliente, dispositivos: [] }]);
    setNombreCliente("");
  };

  const añadirDispositivo = (index) => {
    const nombre = prompt("Dispositivo (ej: iPhone 11)");
    if (!nombre) return;

    const nuevos = [...clientes];
    nuevos[index].dispositivos.push({ nombre, reparaciones: [] });
    setClientes(nuevos);
  };

  const añadirReparacion = (cIndex, dIndex) => {
    const texto = prompt("Reparación");
    if (!texto) return;

    const nuevos = [...clientes];
    nuevos[cIndex].dispositivos[dIndex].reparaciones.push({
      texto,
      estado: "pendiente",
      fecha: new Date().toLocaleDateString(),
    });

    setClientes(nuevos);
  };

  const cambiarEstado = (cIndex, dIndex, rIndex) => {
    const nuevos = [...clientes];
    const rep = nuevos[cIndex].dispositivos[dIndex].reparaciones[rIndex];
    rep.estado = rep.estado === "pendiente" ? "hecho" : "pendiente";
    setClientes(nuevos);
  };

  return (
    <main style={styles.container}>
      <h1 style={styles.title}>🛠️ Ink-Mobile</h1>

      <div style={styles.inputBox}>
        <input
          style={styles.input}
          value={nombreCliente}
          onChange={(e) => setNombreCliente(e.target.value)}
          placeholder="Nombre del cliente"
        />
        <button style={styles.button} onClick={añadirCliente}>
          Añadir
        </button>
      </div>

      {clientes.map((cliente, cIndex) => (
        <div key={cIndex} style={styles.card}>
          <h2>👤 {cliente.nombre}</h2>

          <button style={styles.smallButton} onClick={() => añadirDispositivo(cIndex)}>
            + Dispositivo
          </button>

          {cliente.dispositivos.map((disp, dIndex) => (
            <div key={dIndex} style={styles.device}>
              <h3>💻 {disp.nombre}</h3>

              <button
                style={styles.smallButton}
                onClick={() => añadirReparacion(cIndex, dIndex)}
              >
                + Reparación
              </button>

              <ul>
                {disp.reparaciones.map((rep, rIndex) => (
                  <li key={rIndex} style={styles.repair}>
                    {rep.texto} ({rep.fecha}) -
                    <span
                      style={{
                        color: rep.estado === "hecho" ? "green" : "orange",
                        marginLeft: 5,
                      }}
                    >
                      {rep.estado}
                    </span>

                    <button
                      style={styles.doneButton}
                      onClick={() => cambiarEstado(cIndex, dIndex, rIndex)}
                    >
                      ✔
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </main>
  );
}

const styles = {
  container: {
    padding: 20,
    maxWidth: 600,
    margin: "auto",
    fontFamily: "Arial",
  },
  title: {
    textAlign: "center",
  },
  inputBox: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px 15px",
    borderRadius: 8,
    border: "none",
    background: "black",
    color: "white",
    cursor: "pointer",
  },
  smallButton: {
    marginTop: 10,
    padding: "5px 10px",
    borderRadius: 6,
    border: "none",
    background: "#444",
    color: "white",
    cursor: "pointer",
  },
  card: {
    border: "1px solid #ddd",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    background: "#f9f9f9",
  },
  device: {
    marginLeft: 10,
    marginTop: 10,
  },
  repair: {
    marginTop: 5,
  },
  doneButton: {
    marginLeft: 10,
    background: "green",
    color: "white",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
  },
};
