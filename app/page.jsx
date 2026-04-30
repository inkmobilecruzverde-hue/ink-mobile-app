"use client";

import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

// 🔥 TU FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "ink-mobile-5ee6a.firebaseapp.com",
  projectId: "ink-mobile-5ee6a",
  storageBucket: "ink-mobile-5ee6a.appspot.com",
  messagingSenderId: "174258192559",
  appId: "1:174258192559:web:811e204b406c8199c945a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function Home() {
  const [form, setForm] = useState({});
  const [ordenes, setOrdenes] = useState([]);

  useEffect(() => {
    cargarOrdenes();
  }, []);

  const cargarOrdenes = async () => {
    const querySnapshot = await getDocs(collection(db, "ordenes"));
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setOrdenes(data);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const guardarOrden = async () => {
    const nuevaOrden = {
      ...form,
      numero: Date.now(),
      fecha: new Date().toISOString().split("T")[0],
      estado: "Recibido",
    };

    await addDoc(collection(db, "ordenes"), nuevaOrden);
    setForm({});
    cargarOrdenes();
  };

  const cambiarEstado = async (id, estado) => {
    const ref = doc(db, "ordenes", id);
    await updateDoc(ref, { estado });
    cargarOrdenes();
  };

  const imprimir = (o) => {
    const win = window.open("", "_blank");

    win.document.write(`
      <h2>Ink-Mobile</h2>
      <p>CIF: E56261365</p>
      <p>Calle Cruz Verde Nº22</p>
      <p>Tel: 600 639 228</p>
      <hr/>
      <p><b>Nº Orden:</b> ${o.numero}</p>
      <p><b>Fecha:</b> ${o.fecha}</p>
      <p><b>Nombre:</b> ${o.nombre}</p>
      <p><b>Teléfono:</b> ${o.telefono}</p>
      <p><b>Dispositivo:</b> ${o.dispositivo}</p>
      <p><b>Problema:</b> ${o.problema}</p>
      <p><b>Presupuesto:</b> ${o.presupuesto}</p>
    `);

    win.print();
  };

  const renderTabla = (estado) => (
    <div>
      <h3>{estado}</h3>
      <table border="1">
        <thead>
          <tr>
            <th>Nº</th>
            <th>Fecha</th>
            <th>Nombre</th>
            <th>Dispositivo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ordenes
            .filter((o) => o.estado === estado)
            .map((o) => (
              <tr key={o.id}>
                <td>{o.numero}</td>
                <td>{o.fecha}</td>
                <td>{o.nombre}</td>
                <td>{o.dispositivo}</td>
                <td>
                  <select
                    value={o.estado}
                    onChange={(e) =>
                      cambiarEstado(o.id, e.target.value)
                    }
                  >
                    <option>Recibido</option>
                    <option>Pendiente</option>
                    <option>Pendiente de recambio</option>
                    <option>Finalizado</option>
                  </select>
                  <button onClick={() => imprimir(o)}>🖨️</button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ padding: 20 }}>
      <h1>🛠 Ink-Mobile</h1>

      <h2>Nueva Orden</h2>

      <input name="nombre" placeholder="Nombre" onChange={handleChange} />
      <input name="dni" placeholder="DNI" onChange={handleChange} />
      <input name="telefono" placeholder="Teléfono" onChange={handleChange} />
      <input name="dispositivo" placeholder="Dispositivo" onChange={handleChange} />
      <input name="codigo" placeholder="Código bloqueo" onChange={handleChange} />
      <input name="problema" placeholder="Problema" onChange={handleChange} />
      <input name="notas" placeholder="Notas" onChange={handleChange} />
      <input name="presupuesto" placeholder="Presupuesto" onChange={handleChange} />

      <br /><br />
      <button onClick={guardarOrden}>💾 Guardar orden</button>

      <hr />

      {renderTabla("Recibido")}
      {renderTabla("Pendiente")}
      {renderTabla("Pendiente de recambio")}
      {renderTabla("Finalizado")}
    </div>
  );
}
