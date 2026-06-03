import { RouterProvider } from 'react-router-dom';
import router from './routes/route';
import { AudioPlayerProvider } from './contexts/AudioPlayerContext';
import { DataCacheProvider } from './contexts/DataCacheContext';

function App() {
  return (
    <DataCacheProvider>
      <AudioPlayerProvider>
        <RouterProvider router={router} />
      </AudioPlayerProvider>
    </DataCacheProvider>
  );
}

export default App;