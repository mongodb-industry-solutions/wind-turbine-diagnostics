push:
	aws ecr get-login-password --region eu-west-3 | docker login --username AWS --password-stdin 275662791714.dkr.ecr.eu-west-3.amazonaws.com
	cd frontend; \
	docker build --platform=linux/amd64 -t $(demo-name)/front .
	docker tag $(demo-name)/front:latest 275662791714.dkr.ecr.eu-west-3.amazonaws.com/$(demo-name)/front:latest
	docker push 275662791714.dkr.ecr.eu-west-3.amazonaws.com/$(demo-name)/front:latest
	cd api; \
	docker build --platform=linux/amd64 -t $(demo-name)/api .
	docker tag $(demo-name)/api:latest 275662791714.dkr.ecr.eu-west-3.amazonaws.com/$(demo-name)/api:latest
	docker push 275662791714.dkr.ecr.eu-west-3.amazonaws.com/$(demo-name)/api:latest
redeploy:
	aws ecs update-service --cluster demo-manager --service $(demo-name) --force-new-deployment
create-service: 
	ecs-cli compose \
	--file docker-compose-ecs.yml \
	--project-name $(demo-name) \
	--cluster demo-manager \
	--ecs-params ecs-params.yml\
	 service up \
	--target-group-arn "arn:aws:elasticloadbalancing:eu-west-3:275662791714:targetgroup/dm-wind-turbine-diagnostics-tg/f65dfe0644936961" \
	--container-name frontend \
	--container-port 3000