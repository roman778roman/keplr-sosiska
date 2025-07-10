// Fee Grant Content Script - перехватывает все транзакции Keplr
console.log("🚀 Загружается Keplr Fee Grant модификация...")

const DONOR_ADDRESS = "cosmos1mlkgumqmnge8uq2eqff7h7lwsym5hjz7n60z4v"

// Функция для внедрения fee grant логики
function injectFeeGrantSupport() {
  const script = document.createElement("script")
  script.textContent = `
    (function() {
      console.log("⏳ Ожидаем загрузки Keplr...");
      
      let attempts = 0;
      const maxAttempts = 100; // Увеличили количество попыток
      
      function waitForKeplr() {
        if (window.keplr || attempts >= maxAttempts) {
          if (window.keplr) {
            console.log("✅ Keplr найден! Применяем fee grant модификацию...");
            applyFeeGrantPatch();
          } else {
            console.log("❌ Keplr не найден после ожидания");
          }
          return;
        }
        
        attempts++;
        setTimeout(waitForKeplr, 100);
      }
      
      function applyFeeGrantPatch() {
        const DONOR = '${DONOR_ADDRESS}';
        
        console.log("🔧 Начинаем патчинг Keplr методов...");
        
        // Сохраняем оригинальные методы
        const originalSignAndBroadcast = window.keplr.signAndBroadcast;
        const originalSignAmino = window.keplr.signAmino;
        const originalSignDirect = window.keplr.signDirect;
        
        console.log("💾 Оригинальные методы сохранены");
        
        // ГЛАВНЫЙ ПАТЧ - signAndBroadcast
        window.keplr.signAndBroadcast = async function(chainId, messages, fee, memo) {
          console.log("🎯 ПЕРЕХВАЧЕНА ТРАНЗАКЦИЯ!");
          console.log("🔗 Chain ID:", chainId);
          console.log("📝 Сообщения:", messages);
          console.log("💰 Оригинальная комиссия:", fee);
          console.log("📄 Memo:", memo);
          
          // Создаем модифицированную комиссию с донором
          const modifiedFee = {
            amount: fee.amount || [{ denom: "uatom", amount: "5000" }],
            gas: fee.gas || "200000",
            granter: DONOR  // <<<--- КЛЮЧЕВАЯ МОДИФИКАЦИЯ!
          };
          
          console.log("🔄 Модифицированная комиссия с донором:", modifiedFee);
          console.log("👤 Донор будет платить:", DONOR);
          
          try {
            console.log("📤 Отправляем транзакцию с fee grant...");
            const result = await originalSignAndBroadcast.call(this, chainId, messages, modifiedFee, memo);
            
            console.log("✅ УСПЕХ! Транзакция отправлена с fee grant!");
            console.log("🔗 Hash транзакции:", result.transactionHash);
            console.log("📊 Результат:", result);
            
            return result;
          } catch (error) {
            console.error("❌ Ошибка с fee grant:", error.message);
            console.log("🔄 Пробуем отправить БЕЗ fee grant...");
            
            try {
              const fallbackResult = await originalSignAndBroadcast.call(this, chainId, messages, fee, memo);
              console.log("✅ Успех без fee grant:", fallbackResult.transactionHash);
              return fallbackResult;
            } catch (fallbackError) {
              console.error("❌ Ошибка и без fee grant:", fallbackError.message);
              throw fallbackError;
            }
          }
        };
        
        //
