"use client";

import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

// 🔥 CONFIG FIREBASE (LA TUYA)
const firebaseConfig = {
  apiKey: "AIzaSyCQUkrs1QJFmbrAQqt_dRLmgHfU3Zp-c2Y",
  authDomain: "ink-mobile-5ee6a.firebaseapp.com",
  projectId: "ink-mobile-5ee6a",
  storageBucket: "ink-mobile-5ee6a.appspot.com",
  messagingSenderId: "174258192559",
  appId: "1:174258192559:web:811e204b40c6c8199c945a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export default function Page() {
  const [form, setForm] = useState({});
  const [file, setFile] = useState(null);
  const [ordenes, setOrdenes] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ordenes"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrdenes(data);
    });

    return () => unsub();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const guardarOrden = async () => {
    try {
      let fotoURL = "";

      if (file) {
        const storageRef = ref(
          storage,
          "ordenes/" + Date.now() + "-" + file.name
        );
        await uploadBytes(storageRef, file);
        fotoURL = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "ordenes"), {
        ...form,
        foto: fotoURL,
        fecha: new Date().toISOString().split("T")[0],
        numero: Date.now(),
        estado: "Recibido",
      });

      alert("Orden guardada");

      setForm({});
      setFile(null);

      setTimeout(() => {
        window.print();
      }, 500);
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    }
  };

  const cambiarEstado = async (id, estado) => {
    await updateDoc(doc(db, "ordenes", id), { estado });
  };

  const renderTabla = (estado) => {
    return ordenes
      .filter((o) => o.estado === estado)
      .map((o) => (
        <tr key={o.id}>
          <td>{o.numero}</td>
          <td>{o.fecha}</td>
          <td>{o.nombre}</td>
          <td>{o.dispositivo}</td>
          <td>
            {o.foto && <img src={o.foto} width="50" />}
          </td>
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
          </td>
        </tr>
      ));
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>🔧 Ink-Mobile</h1>

      {/* FORMULARIO */}
      <div style={{ background: "#eee", padding: 20, borderRadius: 10 }}>
        <h2>Nueva orden</h2>

        <input name="nombre" placeholder="Nombre" onChange={handleChange} /><br/>
        <input name="dni" placeholder="DNI" onChange={handleChange} /><br/>
        <input name="telefono" placeholder="Teléfono" onChange={handleChange} /><br/>
        <input name="dispositivo" placeholder="Dispositivo" onChange={handleChange} /><br/>
        <input name="codigo" placeholder="Código desbloqueo" onChange={handleChange} /><br/>
        <input name="problema" placeholder="Problema" onChange={handleChange} /><br/>
        <input name="notas" placeholder="Notas" onChange={handleChange} /><br/>
        <input name="presupuesto" placeholder="Presupuesto (€)" onChange={handleChange} /><br/>

        <input type="file" onChange={(e) => setFile(e.target.files[0])} /><br/><br/>

        <button onClick={guardarOrden}>
          Guardar + imprimir
        </button>
      </div>

      {/* TABLAS */}
      <h2>Órdenes</h2>

      {["Recibido", "Pendiente", "Pendiente de recambio", "Finalizado"].map((estado) => (
        <div key={estado}>
          <h3>{estado}</h3>
          <table border="1">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Fecha</th>
                <th>Nombre</th>
                <th>Dispositivo</th>
                <th>Foto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>{renderTabla(estado)}</tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
