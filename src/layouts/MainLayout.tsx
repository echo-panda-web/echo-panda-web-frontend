import React from 'react';
import { Outlet } from 'react-router-dom';
import Player from '../components/Player';

const MainLayout: React.FC = () => {
  return (
    <div>
      <Outlet />
      <Player />
    </div>
  );
};

export default MainLayout;
