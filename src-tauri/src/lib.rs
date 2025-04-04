use tauri::App;

/// Main entry point for the Tauri application
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running Promptly Social application");
}

/// Initializes application after startup
fn initialize_app(_app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    // Application initialization code will go here
    Ok(())
} 