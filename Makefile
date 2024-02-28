#!make

include .env
export $(shell sed 's/=.*//' .env)

SCRIPT_PATH              := ./scripts/dev/1.ad-hoc.ts
TASK_NAME                := print-contracts
TEST_TARGET              := *.spec.ts
RUST_TOOLCHAIN           := nightly-2023-05-22

.PHONY: init
init: submodules
	command -v rustup > /dev/null 2>&1 || bash -c "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain ${RUST_TOOLCHAIN}"
	command -v typos > /dev/null 2>&1 || bash -c "cargo install typos-cli"
	command -v forge > /dev/null 2>&1 || bash -c "curl -L https://foundry.paradigm.xyz | bash"
	[ -d lib/ds-test ] || forge install --no-commit --no-git https://github.com/dapphub/ds-test
	[ -d lib/forge-std ] || forge install --no-commit --no-git https://github.com/foundry-rs/forge-std
	yarn

.PHONY: test
test:
	npx hardhat test ./test/${TEST_TARGET} --network ${NETWORK} --no-compile
.PHONY: local-test
local-test:
	make MOCHA_JOBS=0 DB_PATH=deployed-contracts.json DEPLOY_START=21 NETWORK=localhost test

.PHONY: slow-test
slow-test:
	MOCHA_JOBS=0 DB_PATH=deployed-contracts.json npx hardhat test ./test/${TEST_TARGET} --network ${NETWORK} --no-compile

.PHONY: fast-test
fast-test:
	MOCHA_JOBS=4 DB_PATH=:memory: npx hardhat test ./test/${TEST_TARGET} --network ${NETWORK} --no-compile

.PHONY: size
size:
	yarn size

.PHONY: build
build: clean
	yarn build --network ${NETWORK}
	yarn typechain

.PHONY: doc
doc:
	yarn doc

.PHONY: lint
lint:
	typos
	yarn lint

.PHONY: coverage
coverage:
	yarn coverage --no-compile

.PHONY: format
format:
	yarn format

.PHONY: clean
clean:
	# yarn cache clean --all
	# YARN_CHECKSUM_BEHAVIOR=update yarn
	yarn clean

.PHONY: ci
ci: clean build lint doc fast-test

.PHONY: submodules
submodules:
	git submodule update --init --recursive
	[ -d lib/ds-test ] && cd lib/ds-test && git pull origin master

.PHONY: test-pool-upgrade
test-pool-upgrade:
	make TEST_TARGET=pool-upgrade.spec.ts test

.PHONY: test-pool-initialization
test-pool-initialization:
	make TEST_TARGET=_pool_initialization.spec.ts test

.PHONY: test-ntoken
test-ntoken:
	make TEST_TARGET=_xtoken_ntoken.spec.ts test

.PHONY: test-ntoken-punk
test-ntoken-punk:
	make TEST_TARGET=ntoken-punk.spec.ts test

.PHONY: test-ptoken
test-ptoken:
	make TEST_TARGET=_xtoken_ptoken.spec.ts test

.PHONY: test-punk-gateway
test-punk-gateway:
	make TEST_TARGET=_gateway_punk.spec.ts test

.PHONY: test-erc20-liquidation
test-erc20-liquidation:
	make TEST_TARGET=_pool_core_erc20_liquidation.spec.ts test

.PHONY: test-erc20-borrow
test-erc20-borrow:
	make TEST_TARGET=_pool_core_erc20_borrow.spec.ts test

.PHONY: test-erc20-supply
test-erc20-supply:
	make TEST_TARGET=_pool_core_erc20_supply.spec.ts test

.PHONY: test-erc20-withdraw
test-erc20-withdraw:
	make TEST_TARGET=_pool_core_erc20_withdraw.spec.ts test

.PHONY: test-erc721-withdraw
test-erc721-withdraw:
	make TEST_TARGET=_pool_core_erc721_withdraw.spec.ts test

.PHONY: test-erc20-repay
test-erc20-repay:
	make TEST_TARGET=_pool_core_erc20_repay.spec.ts test

.PHONY: test-erc721-liquidation
test-erc721-liquidation:
	make TEST_TARGET=_pool_core_erc721_liquidation.spec.ts test

.PHONY: test-erc721-auction-liquidation
test-erc721-auction-liquidation:
	make TEST_TARGET=_pool_core_erc721_auction_liquidation.spec.ts test

.PHONY: test-configurator
test-configurator:
	make TEST_TARGET=_pool_configurator.spec.ts test

.PHONY: test-rescue-tokens
test-rescue-tokens:
	make TEST_TARGET=_pool_parameters_rescue_tokens.spec.ts test

.PHONY: test-upgradeability
test-upgradeability:
	make TEST_TARGET=_base_upgradeability.spec.ts test

.PHONY: test-flash-claim
test-flash-claim:
	make TEST_TARGET=_pool_core_flash_claim.spec.ts test

.PHONY: test-paraspace-oracle-aggregator
test-paraspace-oracle-aggregator:
	make TEST_TARGET=_oracle_aggregator.spec.ts test

.PHONY: test-nft-floor-price-oracle-without-deploy
test-nft-floor-price-oracle-without-deploy:
	make TEST_TARGET=_oracle_nft_floor_price.spec.ts local-test

.PHONY: test-nft-floor-price-oracle
test-nft-floor-price-oracle:
	make TEST_TARGET=_oracle_nft_floor_price.spec.ts test

.PHONY: test-weth-gateway
test-weth-gateway:
	make TEST_TARGET=_gateway_weth.spec.ts test

.PHONY: test-mock-token-faucet
test-mock-token-faucet:
	make TEST_TARGET=_mock_token_faucet.spec.ts test

.PHONY: test-moonbirds
test-moonbirds:
	make TEST_TARGET=_xtoken_ntoken_moonbirds.spec.ts test

.PHONY: test-marketplace-buy
test-marketplace-buy:
	make TEST_TARGET=_pool_marketplace_buy_with_credit.spec.ts test

.PHONY: test-marketplace-accept-bid
test-marketplace-accept-bid:
	make TEST_TARGET=_pool_marketplace_accept_bid_with_credit.spec.ts test

.PHONY: test-marketplace-adapter
test-marketplace-adapter:
	make TEST_TARGET=_pool_marketplace_adapter.spec.ts test

.PHONY: test-uniswap-v3-oracle
test-uniswap-v3-oracle:
	make TEST_TARGET=_uniswap-v3-oracle.spec.ts test

.PHONY: test-uniswap-v3-twap-oracle
test-uniswap-v3-twap-oracle:
	make TEST_TARGET=_uniswap-v3-twap-oracle.spec.ts test

.PHONY: test-uniswap-v3-ltv-validation
test-uniswap-v3-ltv-validation:
	make TEST_TARGET=_uniswap_ltv_validation.spec.ts test

.PHONY: test-uniswap-v3-pool-operation
test-uniswap-v3-pool-operation:
	make TEST_TARGET=_uniswapv3_pool_operation.spec.ts test

.PHONY: test-uniswap-v3-position-control
test-uniswap-v3-position-control:
	make TEST_TARGET=_uniswapv3_position_control.spec.ts test

.PHONY: test-auction-strategy
test-auction-strategy:
	make TEST_TARGET=_base_auction_strategy.spec.ts test

.PHONY: test-variable-debt-token
test-variable-debt-token:
	make TEST_TARGET=_xtoken_variable_debt_token.spec.ts test

.PHONY: test-atomic-tokens-limit
test-atomic-tokens-limit:
	make TEST_TARGET=_xtoken_ntoken_atomic-token-balance_limit.spec.ts test

.PHONY: test-mint-to-treasury
test-mint-to-treasury:
	make TEST_TARGET=_pool_parameters_mint_to_treasury.spec.ts test

.PHONY: test-rebasing-tokens
test-rebasing-tokens:
	make TEST_TARGET=_xtoken_rebasing.spec.ts test

.PHONY: test-steth
test-steth:
	make TEST_TARGET=_xtoken_steth.spec.ts test

.PHONY: test-addresses-provider
test-addresses-provider:
	make TEST_TARGET=_base_addresses_provider.spec.ts test

.PHONY: test-addresses-provider-registry
test-addresses-provider-registry:
	make TEST_TARGET=_base_addresses_provider_registry.spec.ts test

.PHONY: test-oracle-sentinel
test-oracle-sentinel:
	make TEST_TARGET=_oracle_sentinel.spec.ts test

.PHONY: test-user-configurator-used-as-collateral
test-user-configurator-used-as-collateral:
	make TEST_TARGET=_pool_core_use_as_collateral.spec.ts test

.PHONY: test-rate-strategy
test-rate-strategy:
	make TEST_TARGET=_base_interest_rate_strategy.spec.ts test

.PHONY: test-reserve-configuration
test-reserve-configuration:
	make TEST_TARGET=_base_reserve_configuration.spec.ts test

.PHONY: test-scenario
test-scenario:
	make TEST_TARGET=scenario.spec.ts test

.PHONY: test-data-providers
test-data-providers:
	make TEST_TARGET=_data_providers.spec.ts test

.PHONY: test-ape-staking
test-ape-staking:
	make TEST_TARGET=_pool_ape_staking.spec.ts test

.PHONY: test-auto-compound-ape
test-auto-compound-ape:
	make TEST_TARGET=auto_compound_ape.spec.ts test

.PHONY: test-p2p-pair-staking
test-p2p-pair-staking:
	make TEST_TARGET=p2p_pair_staking.spec.ts test

.PHONY: test-sape-operation
test-sape-operation:
	make TEST_TARGET=_sape_pool_operation.spec.ts test

.PHONY: test-acl-manager
test-acl-manager:
	make TEST_TARGET=acl-manager.spec.ts test

.PHONY: test-timelock-executor
test-timelock-executor:
	make TEST_TARGET=time_lock_executor.spec.ts test

.PHONY: test-timelock
test-timelock:
	make TEST_TARGET=_timelock.spec.ts test

.PHONY: test-timelock-whitelist
test-timelock-whitelist:
	make TEST_TARGET=_timelock_whitelist.spec.ts test

.PHONY: test-stakefish-nft
test-stakefish-nft:
	make TEST_TARGET=_stakefish_nft.spec.ts test

.PHONY: run
run:
	npx hardhat run $(SCRIPT_PATH) --network $(NETWORK) --no-compile

.PHONY: run-task
run-task:
	DB_PATH=deployed-contracts.json npx hardhat $(TASK_NAME) $(ARG0) ${ARG1} ${ARG2} ${ARG3} --network $(NETWORK)

.PHONY: print
print:
	make TASK_NAME=print-contracts run-task

.PHONY: verify
verify:
	make TASK_NAME=verify-contracts run-task

.PHONY: deploy
deploy:
	make TASK_NAME=deploy:all run-task

.PHONY: deploy-ERC20Tokens
deploy-ERC20Tokens:
	make TASK_NAME=deploy:erc20-tokens run-task

.PHONY: deploy-ERC721Tokens
deploy-ERC721Tokens:
	make TASK_NAME=deploy:erc721-tokens run-task

.PHONY: deploy-faucet
deploy-faucet:
	make TASK_NAME=deploy:faucet run-task

.PHONY: deploy-addressProvider
deploy-addressProvider:
	make TASK_NAME=deploy:address-provider run-task

.PHONY: deploy-aclManager
deploy-aclManager:
	make TASK_NAME=deploy:acl-manager run-task

.PHONY: deploy-pool
deploy-pool:
	make TASK_NAME=deploy:pool run-task

.PHONY: deploy-poolConfigurator
deploy-poolConfigurator:
	make TASK_NAME=deploy:pool-configurator run-task

.PHONY: deploy-reservesSetupHelper
deploy-reservesSetupHelper:
	make TASK_NAME=deploy:reserves-setup-helper run-task

.PHONY: deploy-oracle
deploy-oracle:
	make TASK_NAME=deploy:oracle run-task

.PHONY: deploy-allAggregators
deploy-allAggregators:
	make TASK_NAME=deploy:all-aggregators run-task

.PHONY: deploy-allReserves
deploy-allReserves:
	make TASK_NAME=deploy:all-reserves run-task

.PHONY: deploy-uiIncentiveDataProvider
deploy-uiIncentiveDataProvider:
	make TASK_NAME=deploy:ui-incentive-data-provider run-task

.PHONY: deploy-uiPoolDataProvider
deploy-uiPoolDataProvider:
	make TASK_NAME=deploy:ui-pool-data-provider run-task

.PHONY: deploy-wethGateway
deploy-wethGateway:
	make TASK_NAME=deploy:weth-gateway run-task

.PHONY: deploy-punkGateway
deploy-punkGateway:
	make TASK_NAME=deploy:punk-gateway run-task

.PHONY: deploy-seaport
deploy-seaport:
	make TASK_NAME=deploy:seaport run-task

.PHONY: deploy-looksrare
deploy-looksrare:
	make TASK_NAME=deploy:looksrare run-task

.PHONY: deploy-x2y2
deploy-x2y2:
	make TASK_NAME=deploy:x2y2 run-task

.PHONY: deploy-blur-exchange
deploy-blur-exchange:
	make TASK_NAME=deploy:blur-exchange run-task

.PHONY: deploy-flashClaimRegistry
deploy-flashClaimRegistry:
	make TASK_NAME=deploy:flash-claim-registry run-task

.PHONY: deploy-p2p-pair-staking
deploy-p2p-pair-staking:
	make TASK_NAME=deploy:P2PPairStaking run-task

.PHONY: deploy-timelock
deploy-timelock:
	make TASK_NAME=deploy:timelock run-task

.PHONY: deploy-renounceOwnership
deploy-renounceOwnership:
	make TASK_NAME=deploy:renounce-ownership run-task

.PHONY: deploy-all-libraries
deploy-all-libraries:
	make TASK_NAME=deploy:all-libraries run-task

.PHONY: ad-hoc
ad-hoc:
	make SCRIPT_PATH=./scripts/dev/1.ad-hoc.ts run

.PHONY: info
info:
	make SCRIPT_PATH=./scripts/dev/3.info.ts run

.PHONY: wallet
wallet:
	make SCRIPT_PATH=./scripts/dev/4.wallet.ts run

.PHONY: rate-strategy
rate-strategy:
	make SCRIPT_PATH=./scripts/dev/5.rate-strategy.ts run

.PHONY: auction-strategy
auction-strategy:
	make SCRIPT_PATH=./scripts/dev/6.auction-strategy.ts run

.PHONY: timelock-strategy
timelock-strategy:
	make SCRIPT_PATH=./scripts/dev/7.timelock-strategy.ts run

.PHONY: set-interval-mining
set-interval-mining:
	make SCRIPT_PATH=./scripts/dev/8.set-interval-mining.ts run

.PHONY: set-auto-mining
set-auto-mining:
	make SCRIPT_PATH=./scripts/dev/9.set-auto-mining.ts run

.PHONY: send-eth
send-eth:
	make SCRIPT_PATH=./scripts/dev/10.send-eth.ts run

.PHONY: set-traits-multipliers
set-traits-multipliers:
	make SCRIPT_PATH=./scripts/dev/11.set-traits-multipliers.ts run

.PHONY: update-timelock-strategy
update-timelock-strategy:
	make SCRIPT_PATH=./scripts/dev/12.set-timelock-strategy.ts run

.PHONY: acl
acl:
	make SCRIPT_PATH=./scripts/dev/13.acl.ts run

.PHONY: zksync-bytecode-hashes
zksync-bytecode-hashes:
	make SCRIPT_PATH=./scripts/dev/14.zksync-bytecode-hashes.ts run

.PHONY: redeploy-market
redeploy-market:
	make SCRIPT_PATH=./scripts/dev/15.redeploy-market.ts run

.PHONY: upgrade-pool-aa-position-mover
upgrade-pool-aa-position-mover:
	make TASK_NAME=upgrade:pool-aa-position-mover run-task

.PHONY: transfer-tokens
transfer-tokens:
	make SCRIPT_PATH=./scripts/dev/2.transfer-tokens.ts run

.PHONY: market-info
market-info:
	make TASK_NAME=market-info run-task

.PHONY: account-data
account-data:
	make TASK_NAME=account-data run-task

.PHONY: decode
decode:
	make TASK_NAME=decode run-task

.PHONY: decode-multi
decode-multi:
	make TASK_NAME=decode-multi run-task

.PHONY: decode-tx
decode-tx:
	make TASK_NAME=decode-tx run-task

.PHONY: next-execution-time
next-execution-time:
	make TASK_NAME=next-execution-time run-task

.PHONY: increase-to-execution-time
increase-to-execution-time:
	make TASK_NAME=increase-to-execution-time run-task

.PHONY: queue-tx
queue-tx:
	make TASK_NAME=queue-tx run-task

.PHONY: execute-tx
execute-tx:
	make TASK_NAME=execute-tx run-task

.PHONY: cancel-tx
cancel-tx:
	make TASK_NAME=cancel-tx run-task

.PHONY: list-queued-txs
list-queued-txs:
	make TASK_NAME=list-queued-txs run-task

.PHONY: decode-queued-txs
decode-queued-txs:
	make TASK_NAME=decode-queued-txs run-task

.PHONY: list-buffered-txs
list-buffered-txs:
	make TASK_NAME=list-buffered-txs run-task

.PHONY: renew-buffered-txs
renew-buffered-txs:
	make TASK_NAME=renew-buffered-txs run-task

.PHONY: decode-buffered-txs
decode-buffered-txs:
	make TASK_NAME=decode-buffered-txs run-task

.PHONY: queue-buffered-txs
queue-buffered-txs:
	make TASK_NAME=queue-buffered-txs run-task

.PHONY: execute-buffered-txs
execute-buffered-txs:
	make TASK_NAME=execute-buffered-txs run-task

.PHONY: cancel-buffered-txs
cancel-buffered-txs:
	make TASK_NAME=cancel-buffered-txs run-task

.PHONY: decode-safe-txs
decode-safe-txs:
	make TASK_NAME=decode-safe-txs run-task

.PHONY: propose-buffered-txs
propose-buffered-txs:
	make TASK_NAME=propose-buffered-txs run-task

.PHONY: propose-queued-txs
propose-queued-txs:
	make TASK_NAME=propose-queued-txs run-task

.PHONY: set-ltv
set-ltv:
	make TASK_NAME=set-ltv run-task

.PHONY: set-liquidation-threshold
set-liquidation-threshold:
	make TASK_NAME=set-liquidation-threshold run-task

.PHONY: set-reserve-factor
set-reserve-factor:
	make TASK_NAME=set-reserve-factor run-task

.PHONY: reset-all-asset-reserve-factor
reset-all-asset-reserve-factor:
	make TASK_NAME=reset-all-asset-reserve-factor run-task

.PHONY: set-interest-rate-strategy
set-interest-rate-strategy:
	make TASK_NAME=set-interest-rate-strategy run-task

.PHONY: set-auction-strategy
set-auction-strategy:
	make TASK_NAME=set-auction-strategy run-task

.PHONY: set-timelock-strategy
set-timelock-strategy:
	make TASK_NAME=set-timelock-strategy run-task

.PHONY: set-supply-cap
set-supply-cap:
	make TASK_NAME=set-supply-cap run-task

.PHONY: set-borrow-cap
set-borrow-cap:
	make TASK_NAME=set-borrow-cap run-task

.PHONY: set-pool-pause
set-pool-pause:
	make TASK_NAME=set-pool-pause run-task

.PHONY: set-reserve-pause
set-reserve-pause:
	make TASK_NAME=set-reserve-pause run-task

.PHONY: set-cAPE-pause
set-cAPE-pause:
	make TASK_NAME=set-cAPE-pause run-task

.PHONY: list-facets
list-facets:
	make TASK_NAME=list-facets run-task

.PHONY: list-facet-addresses
list-facet-addresses:
	make TASK_NAME=list-facet-addresses run-task

.PHONY: facet-address
facet-address:
	make TASK_NAME=facet-address run-task

.PHONY: facet-function-selectors
facet-function-selectors:
	make TASK_NAME=facet-function-selectors run-task

.PHONY: rescue-erc20-from-ntoken
rescue-erc20-from-ntoken:
	make TASK_NAME=rescue-erc20-from-ntoken run-task

.PHONY: unfreeze-agreement
unfreeze-agreement:
	make TASK_NAME=unfreeze-agreement run-task

.PHONY: upgrade
upgrade:
	make TASK_NAME=upgrade:all run-task

.PHONY: upgrade-pool
upgrade-pool:
	make TASK_NAME=upgrade:pool run-task

.PHONY: upgrade-pool-core
upgrade-pool-core:
	make TASK_NAME=upgrade:pool-core run-task

.PHONY: upgrade-pool-marketplace
upgrade-pool-marketplace:
	make TASK_NAME=upgrade:pool-marketplace run-task

.PHONY: upgrade-pool-ape-staking
upgrade-pool-ape-staking:
	make TASK_NAME=upgrade:pool-ape-staking run-task

.PHONY: upgrade-borrow_ape_and_stake
upgrade-borrow_ape_and_stake:
	make TASK_NAME=upgrade:borrow-ape-and-stake run-task

.PHONY: upgrade-pool-parameters
upgrade-pool-parameters:
	make TASK_NAME=upgrade:pool-parameters run-task

.PHONY: upgrade-pool-position-mover
upgrade-pool-position-mover:
	make TASK_NAME=upgrade:pool-position-mover run-task

.PHONY: reset-pool
reset-pool:
	make TASK_NAME=reset:pool run-task

.PHONY: upgrade-configurator
upgrade-configurator:
	make TASK_NAME=upgrade:configurator run-task

.PHONY: upgrade-auto-compound-ape
upgrade-auto-compound-ape:
	make TASK_NAME=upgrade:auto-compound-ape run-task

.PHONY: upgrade-timelock
upgrade-timelock:
	make TASK_NAME=upgrade:timelock run-task

.PHONY: upgrade-helper-contract
upgrade-helper-contract:
	make TASK_NAME=upgrade:helper-contract run-task

.PHONY: upgrade-account-abstraction
upgrade-account-abstraction:
	make TASK_NAME=upgrade:account-abstraction run-task

.PHONY: upgrade-p2p-pair-staking
upgrade-p2p-pair-staking:
	make TASK_NAME=upgrade:p2p-pair-staking run-task

.PHONY: upgrade-ntoken
upgrade-ntoken:
	make TASK_NAME=upgrade:ntoken run-task

.PHONY: upgrade-ptoken
upgrade-ptoken:
	make TASK_NAME=upgrade:ptoken run-task

.PHONY: upgrade-debt-token
upgrade-debt-token:
	make TASK_NAME=upgrade:debt-token run-task

.PHONY: add-emergency-admin
add-emergency-admin:
	make TASK_NAME=add-emergency-admin run-task

.PHONY: add-pool-admin
add-pool-admin:
	make TASK_NAME=add-pool-admin run-task

.PHONY: remove-emergency-admin
remove-emergency-admin:
	make TASK_NAME=remove-emergency-admin run-task

.PHONY: hardhat
hardhat:
	npx hardhat node --hostname 0.0.0.0

.PHONY: anvil
anvil:
	anvil \
		$(if $(FORK),--fork-url https://eth-$(FORK).alchemyapi.io/v2/$(ALCHEMY_KEY) --chain-id 522 --no-rate-limit,--chain-id 31337) \
		$(if $(FORK_BLOCK_NUMBER),--fork-block-number $(FORK_BLOCK_NUMBER),) \
		$(if $(DEPLOYER_MNEMONIC),--mnemonic "${DEPLOYER_MNEMONIC}",--mnemonic "test test test test test test test test test test test junk") \
		--host 0.0.0.0 \
		--state-interval 60 \
		--dump-state state.json \
		$(if $(wildcard state.json),--load-state state.json,) \
		--disable-block-gas-limit \
		--code-size-limit 100000 \
		--timeout 9000000

.PHONY: image
image:
	docker build \
		-c 512 \
		-t parallelfinance/paraspace:latest \
		-f Dockerfile.${JSONRPC_VARIANT} .

.PHONY: launch
launch: shutdown
	docker-compose \
		up \
		-d --build
	docker-compose logs -f node

.PHONY: shutdown
shutdown:
	sudo pkill anvil || true
	docker-compose \
		down \
		--remove-orphans > /dev/null 2>&1 || true
	docker volume prune -f || true
	sudo rm -fr redis-data || true
	sudo rm -fr logs || true
	sudo rm -fr state.json || true

.PHONY: copy
copy:
	docker cp paraspace-core_node_1:/paraspace/deployed-contracts.json .

help:
	@grep -E '^[a-zA-Z_-]+:.*?' Makefile | cut -d: -f1 | sort
