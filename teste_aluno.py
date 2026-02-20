import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import UnexpectedAlertPresentException, TimeoutException
from dotenv import load_dotenv

load_dotenv()

chrome_options = Options()
chrome_options.add_argument("--start-maximized")
driver = webdriver.Chrome(options=chrome_options)

SITE_URL = os.getenv("TEST_SITE_URL")

id_unico = str(int(time.time()))
email_teste = f"aluno_new_{id_unico}@teste.com"
senha_teste = "senhaSegura123"

def lidar_com_alertas_pendentes(driver):
    """Função auxiliar para fechar alertas inesperados antes de tirar print"""
    try:
        alert = driver.switch_to.alert
        print(f"⚠️ Fechando alerta inesperado: {alert.text}")
        alert.accept()
    except:
        pass

try:
    print(f"1. Abrindo o site: {SITE_URL}")
    driver.get(SITE_URL)
    wait = WebDriverWait(driver, 15)

    print("2. Trocando para o painel de Cadastro...")
    wait.until(EC.element_to_be_clickable((By.ID, "btn-ir-cadastro"))).click()

    print(f"3. Preenchendo dados do novo aluno ({email_teste})...")
    wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "#form-cadastro input[name='nome']"))).send_keys("Teste")
    driver.find_element(By.CSS_SELECTOR, "#form-cadastro input[name='sobrenome']").send_keys("Qualidade")
    driver.find_element(By.CSS_SELECTOR, "#form-cadastro input[name='email']").send_keys(email_teste)
    
    driver.find_element(By.ID, "reg-senha").send_keys(senha_teste)
    driver.find_element(By.ID, "reg-conf-senha").send_keys(senha_teste)
    
    driver.find_element(By.CSS_SELECTOR, "#form-cadastro input[name='cep']").send_keys("01001-000")
    driver.find_element(By.CSS_SELECTOR, "#form-cadastro input[name='numero']").send_keys("123")
    driver.find_element(By.CSS_SELECTOR, "#form-cadastro input[name='rua']").send_keys("Rua da Automação")

    driver.find_element(By.CSS_SELECTOR, "#form-cadastro .btn-primary").click()

    print("4. Aguardando a resposta de sucesso do servidor...")
    wait.until(EC.alert_is_present())
    alerta_sucesso = driver.switch_to.alert
    assert "sucesso" in alerta_sucesso.text.lower()
    alerta_sucesso.accept() 

    print("5. Realizando Login com a conta recém-criada...")
    wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "#form-login input[name='email']"))).send_keys(email_teste)
    driver.find_element(By.CSS_SELECTOR, "#form-login input[name='senha']").send_keys(senha_teste)
    driver.find_element(By.CSS_SELECTOR, "#form-login .btn-primary").click()

    print("6. Buscando cursos disponíveis para matrícula...")
    try:
        btn_matricular = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "#grid-cursos .btn-primary")))
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn_matricular)
        time.sleep(1)
        btn_matricular.click()
        
        print("7. Confirmando a matrícula...")
        wait.until(EC.alert_is_present())
        driver.switch_to.alert.accept() # Aceita a pergunta: "Confirmar matrícula?"
        
        # AGORA O ROBÔ VAI LER O SEGUNDO ALERTA!
        wait.until(EC.alert_is_present())
        alerta_resultado = driver.switch_to.alert
        mensagem = alerta_resultado.text
        alerta_resultado.accept()
        
        # Se a mensagem for o erro "Faça login", o teste quebra na hora aqui:
        assert "realizada" in mensagem.lower(), f"❌ ERRO DO BACKEND: {mensagem}"

        print("8. Verificando se o curso apareceu no Perfil do Aluno...")
        tabela_matriculas = wait.until(EC.visibility_of_element_located((By.ID, "tabela-minhas-matriculas")))
        assert "Nenhuma matrícula" not in tabela_matriculas.text
        
        print("✅ TESTE E2E COMPLETO PASSOU (E DE VERDADE DESSA VEZ)!")

    except Exception as e:
        print(f"❌ O TESTE FALHOU NA MATRÍCULA: {e}")
       

except UnexpectedAlertPresentException as e:
    print(f"❌ UM ALERTA INESPERADO BLOQUEOU O TESTE: {e.alert_text}")
    lidar_com_alertas_pendentes(driver)
   

except Exception as e:
    print(f"❌ O TESTE FALHOU DEVIDO A UM ERRO NÃO TRATADO: {e}")
    lidar_com_alertas_pendentes(driver)
   

finally:
    print("Fechando o navegador em 5 segundos...")
    time.sleep(5)
    driver.quit()