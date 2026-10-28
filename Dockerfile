# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY ["RentFlow.API/RentFlow.API.csproj", "RentFlow.API/"]
RUN dotnet restore "RentFlow.API/RentFlow.API.csproj"

# Copy all source code and publish release build
COPY RentFlow.API/ RentFlow.API/
WORKDIR "/src/RentFlow.API"
RUN dotnet publish "RentFlow.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 10000
ENV ASPNETCORE_URLS=http://+:10000
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "RentFlow.API.dll"]
