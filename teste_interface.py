import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
from dotenv import load_dotenv

load_dotenv()

chrome_options = Options()
chrome_options.add_argument("--start-maximized")



driver = webdriver.Chrome(options=chrome_options)


SITE_URL = os.getenv("TEST_SITE_URL")
ADMIN_EMAIL = os.getenv("TEST_ADMIN_EMAIL")
ADMIN_PASS = os.getenv("TEST_ADMIN_PASSWORD")

if not all([SITE_URL, ADMIN_EMAIL, ADMIN_PASS]):
    raise ValueError("ERRO: Configure as variáveis")

try:
    print(f"1. Abrindo o site: {SITE_URL}")
    driver.get(SITE_URL)

    
    wait_curto = WebDriverWait(driver, 5)
    wait_longo = WebDriverWait(driver, 60) 

    print("2. Preenchendo login")
    email_input = wait_curto.until(EC.presence_of_element_located((By.NAME, "email")))
    email_input.send_keys(ADMIN_EMAIL)

    driver.find_element(By.NAME, "senha").send_keys(ADMIN_PASS)

    print("3. Clicando em Entrar. Aguardando o Render acordar...")
    driver.find_element(By.CSS_SELECTOR, "#form-login .btn-primary").click()
    
    nome_usuario = wait_longo.until(EC.visibility_of_element_located((By.ID, "display-name")))

    assert "Administrador" in nome_usuario.text
    print("SUCESSO: Login de Admin realizado e dashboard carregado!")



except Exception as e:
    print(f"FALHA NO TESTE: {e}")


finally:
    print("Encerrando em 3 segundos...")
    time.sleep(3)
    driver.quit()