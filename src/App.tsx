import { RouterProvider } from 'react-router-dom';
import router from './routes/route';
import { AudioPlayerProvider } from './contexts/AudioPlayerContext';
import { DataCacheProvider } from './contexts/DataCacheContext';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <DataCacheProvider>
        <AudioPlayerProvider>
          <RouterProvider router={router} />
        </AudioPlayerProvider>
      </DataCacheProvider>
    </ThemeProvider>
  );
}

export default App;