use std::fs::File;
use std::io::Write;
use tauri::Manager;
use futures_util::StreamExt;
use reqwest;

#[tauri::command]
async fn download_and_run(app_handle: tauri::AppHandle, url: String) -> Result<(), String> {
    let client = reqwest::Client::new();
    let mut response = client.get(&url).send().await.map_err(|e| {
        println!("Error sending request: {}", e);
        e.to_string()
    })?;

    let total_size = response.content_length().ok_or_else(|| {
        println!("Failed to get content length");
        "Failed to get content length".to_string()
    })?;

    let app_cache_dir = app_handle.path_resolver().app_cache_dir().ok_or_else(|| {
        println!("Failed to get cache directory");
        "Failed to get cache directory".to_string()
    })?;
    let file_path = app_cache_dir.join("downloaded_file.exe");
    let mut dest = File::create(&file_path).map_err(|e| {
        println!("Error creating file: {}", e);
        e.to_string()
    })?;

    let mut downloaded = 0;
    while let Some(chunk) = response.chunk().await.map_err(|e| {
        println!("Error reading chunk: {}", e);
        e.to_string()
    })? {
        dest.write_all(&chunk).map_err(|e| {
            println!("Error writing to file: {}", e);
            e.to_string()
        })?;
        downloaded += chunk.len() as u64;
        app_handle.emit_all("progress", (downloaded, total_size)).map_err(|e| {
            println!("Error emitting progress: {}", e);
            e.to_string()
        })?;
    }

    if cfg!(target_os = "windows") {
        std::process::Command::new("cmd")
            .args(&["/C", file_path.to_str().unwrap()])
            .spawn()
            .map_err(|e| {
                println!("Error spawning process: {}", e);
                e.to_string()
            })?;
    } else if cfg!(target_os = "macos") {
        std::process::Command::new("open")
            .arg(file_path.to_str().unwrap())
            .spawn()
            .map_err(|e| {
                println!("Error spawning process: {}", e);
                e.to_string()
            })?;
    } else if cfg!(target_os = "linux") {
        std::process::Command::new("xdg-open")
            .arg(file_path.to_str().unwrap())
            .spawn()
            .map_err(|e| {
                println!("Error spawning process: {}", e);
                e.to_string()
            })?;
    } else {
        println!("Unsupported platform!");
        return Err("Unsupported platform!".into());
    }

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![download_and_run])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
