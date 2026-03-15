import { AppConfig } from '../components/ApiKeySetupScreen';

export function getConfigFileName(): string {
  return localStorage.getItem('tutorxyz_config_filename') || 'tutorxyz_config.json';
}

export function setConfigFileName(name: string) {
  localStorage.setItem('tutorxyz_config_filename', name);
}

export async function getConfigFromDrive(accessToken: string): Promise<AppConfig | null> {
  try {
    const fileName = getConfigFileName();
    // 1. Find the file in appDataFolder
    const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${fileName}'`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!searchResponse.ok) return null;
    const searchData = await searchResponse.json();
    
    if (!searchData.files || searchData.files.length === 0) {
      return null;
    }
    
    const fileId = searchData.files[0].id;
    
    // 2. Read the file content
    const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!fileResponse.ok) return null;
    const config = await fileResponse.json();
    return {
      geminiApiKey: config.geminiApiKey || '',
      calendarName: config.calendarName || '📖 AI單字家教紀錄',
      configFileName: fileName,
      teacherStyle: config.teacherStyle || 'enthusiastic'
    };
  } catch (e) {
    console.error("Error reading from Drive", e);
    return null;
  }
}

export async function saveConfigToDrive(accessToken: string, config: AppConfig): Promise<boolean> {
  try {
    const fileName = config.configFileName;
    setConfigFileName(fileName);

    // 1. Check if file exists
    const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${fileName}'`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    const searchData = await searchResponse.json();
    const fileExists = searchData.files && searchData.files.length > 0;
    
    const metadata = {
      name: fileName,
      parents: ['appDataFolder']
    };
    
    const fileContent = JSON.stringify({ 
      geminiApiKey: config.geminiApiKey,
      calendarName: config.calendarName
    });
    const file = new Blob([fileContent], { type: 'application/json' });
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);
    
    if (fileExists) {
      // Update existing file
      const fileId = searchData.files[0].id;
      const updateResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form
      });
      return updateResponse.ok;
    } else {
      // Create new file
      const createResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form
      });
      return createResponse.ok;
    }
  } catch (e) {
    console.error("Error saving to Drive", e);
    return false;
  }
}
