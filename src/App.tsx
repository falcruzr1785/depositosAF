
import {  Route, Routes } from "react-router-dom";
import Subasta from './pages/Subasta';
import Naviera from './pages/Naviera';
import Home from './pages/Home';
import Layout from './pages/Layout';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './App.css'
import InfoVehiculo from "./pages/InfoVehiculo";


function App() {


  return (
    <div className="main-content">
    <Navbar/>
      <Routes>
      
      <Route path="/" element={<Layout />} />
      <Route index element={<Home />} />
      <Route path="subasta" element={<Subasta />} />
      <Route path="naviera" element={<Naviera />} />
      <Route path="infoVehiculo" element={<InfoVehiculo />} />

     <Route path="*" element={<Home />} />

  </Routes>
  <Footer/>
  </div>
  )
}

export default App
